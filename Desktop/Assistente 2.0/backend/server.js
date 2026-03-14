const express = require('express');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

puppeteerExtra.use(StealthPlugin());

const app = express();
const port = 3000;
const cache = new Map();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    console.log('Acessando endpoint /');
    res.send('Servidor está ativo!');
});

app.post('/search', async (req, res) => {
    const query = req.body.query;
    console.log('Recebida query:', query);

    if (!query) return res.status(400).json({ error: 'Pergunta não fornecida' });

    if (cache.has(query)) return res.json({ response: cache.get(query) });

    let browser;
    try {
        console.log('Iniciando Puppeteer com Stealth...');
        browser = await puppeteerExtra.launch({
            headless: false,
            protocolTimeout: 900000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080',
                '--disable-web-security',
                '--user-data-dir=/tmp/puppeteer_temp'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });

        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36');

        try {
            const cookiesString = await fs.readFile('./cookies.json');
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
            console.log('Cookies carregados.');
        } catch (err) {
            console.log('Sem cookies — login necessário.');
        }

        console.log('Navegando para chat...');
        await page.goto('https://hix.ai/chat', { waitUntil: 'networkidle2', timeout: 120000 });

        const content = await page.content();
        if (content.includes('blocked') || content.includes('Cloudflare Ray ID')) {
            console.log('Cloudflare detectado, continuando.');
            await page.screenshot({ path: 'cloudflare-detectado.png', fullPage: true });
        }

        console.log('Verificando login...');
        const loginSelectors = 'button[class*="google"], button[class*="facebook"], button[class*="signin"], a[href*="login"], a[href*="sign-in"], [class*="login"], [id*="login"]';
        const loginEl = await page.$(loginSelectors);
        if (loginEl) {
            console.log('LOGIN DETECTADO! Logue manualmente agora (tem 4 minutos).');
            await page.screenshot({ path: 'login-page.png', fullPage: true });
            await delay(240000);
        }

        if (loginEl || page.url().includes('/home')) {
            console.log('Redirecionando para chat...');
            await page.goto('https://hix.ai/chat', { waitUntil: 'networkidle2', timeout: 60000 });
            await delay(90000);
        }

        console.log('Aguardando campo de input...');
        await delay(30000);

        const selectors = [
            'textarea[placeholder*="What can I help"]',
            'textarea[placeholder*="help"]',
            'textarea#prompt-textarea',
            'textarea#prompt',
            'textarea.prompt',
            'div[contenteditable="true"]',
            'div.ProseMirror',
            '[role="textbox"]',
            'textarea'
        ];

        let inputSelector = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`Tentativa ${attempt} de achar input...`);
            for (const sel of selectors) {
                console.log(`Testando: ${sel}`);
                const el = await page.$(sel);
                if (el) {
                    const vis = await page.evaluate(e => {
                        const r = e.getBoundingClientRect();
                        const s = window.getComputedStyle(e);
                        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
                    }, el).catch(() => false);
                    if (vis) {
                        inputSelector = sel;
                        console.log(`Input encontrado na tentativa ${attempt}: ${sel}`);
                        break;
                    }
                }
            }
            if (inputSelector) break;
            await delay(15000);
        }

        if (!inputSelector) {
            await page.screenshot({ path: 'no-input-final.png', fullPage: true });
            console.log('Input NÃO encontrado. Print salvo.');
            return res.status(500).json({ error: 'Campo de input não encontrado. Veja no-input-final.png' });
        }

        console.log('Digitando query...');
        await page.focus(inputSelector);
        await page.type(inputSelector, query);

        await delay(4000);

        const sendSel = 'button[aria-label*="Send"], button[aria-label*="Enviar"], button[class*="send"], button[type="submit"], [data-testid="send-button"], button svg path[d*="send"]';
        const sendBtn = await page.$(sendSel);
        if (sendBtn) {
            await sendBtn.click();
            console.log('Send clicado');
        } else {
            await page.keyboard.press('Enter');
            console.log('Enter pressionado');
        }

        console.log('Aguardando resposta do HIX (pode demorar)...');
        await delay(90000); // 1.5 min inicial

        const initCount = await page.evaluate(() => document.querySelectorAll('.markdown-body, .prose, .message-content, .response, .chat-message, .text, .ai-response').length);
        console.log(`Elementos iniciais: ${initCount}`);

        try {
            await page.waitForFunction(
                (init) => document.querySelectorAll('.markdown-body, .prose, .message-content, .response, .chat-message, .text, .ai-response').length > init,
                { timeout: 420000 },
                initCount
            );
            console.log('Nova resposta detectada.');
        } catch (e) {
            console.log('Timeout na espera — tentando capturar mesmo assim.');
        }

        await delay(180000); // 3 min extras

        await page.screenshot({ path: 'resposta-final.png', fullPage: true });
        console.log('Print final salvo: resposta-final.png');

        let respText = '';
        for (let retry = 1; retry <= 3; retry++) {
            console.log(`Tentativa ${retry} de capturar resposta...`);
            try {
                respText = await page.evaluate((userQuery) => {
                    const els = document.querySelectorAll('.markdown-body, .prose, .message-content, .response, .chat-message, .text, .ai-response');
                    if (els.length === 0) return '';

                    const last = els[els.length - 1];
                    let txt = last.innerText.trim();
                    if (txt.startsWith(userQuery.trim())) {
                        txt = txt.substring(userQuery.trim().length).trim();
                    }
                    return txt;
                }, query);
                if (respText.length > 5) break;
            } catch (e) {
                console.log('Erro na tentativa:', e.message);
            }
            await delay(30000);
        }

        console.log('Resposta capturada final:', respText);

        if (respText.length < 5) {
            return res.json({ response: 'Resposta carregou no HIX, mas não foi capturada. Abra resposta-final.png e veja o chat.' });
        }

        cache.set(query, respText);
        res.json({ response: respText });

    } catch (err) {
        console.error('Erro:', err.message, err.stack);
        res.status(500).json({ error: 'Erro interno. Veja logs e resposta-final.png' });
    } finally {
        if (browser) {
            await delay(600000); // 10 minutos para ver tudo
            await browser.close();
            console.log('Navegador fechado.');
        }
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});