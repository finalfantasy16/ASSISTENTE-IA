# Assistente Virtual Nia

Este projeto é uma **assistente virtual chamada Nia**. Ele combina respostas pré-programadas com um mecanismo de busca de respostas em IA (HIX AI) via **web scraping com Puppeteer**.

## 🧠 Para que serve a Nia

A Nia é uma interface simples que permite ao usuário:

- Fazer perguntas em linguagem natural (Português) e receber respostas imediatas.
- Obter respostas rápidas usando um conjunto de respostas pré-definidas (para perguntas comuns).
- Consultar o **HIX AI** para obter respostas mais abrangentes quando não há resposta pré-definida.
- Carregar arquivos (texto, Word, imagens) para obter uma análise básica do conteúdo.
- Manter um histórico simples de interações recentes.

## ⚙️ Como funciona

A aplicação tem duas partes principais:

### 1) Frontend (Interface do usuário)
Localizada em `backend/public/`:

- `index.html`: página web que exibe a interface da Nia.
- `assistant.js`: lógica principal da interface:
  - Normaliza perguntas e corrige erros comuns.
  - Busca respostas pré-definidas localmente (funciona offline).
  - Quando não encontra resposta local, chama o backend para consultar o HIX AI.
  - Possui recursos como histórico, detecção de conexão, análise básica de arquivos e conversão planejada.

### 2) Backend (Servidor local)
Localizado em `backend/server.js`:

- Usa **Express** para expor API (`POST /search`) que recebe uma pergunta.
- Utiliza **Puppeteer + stealth plugin** para abrir o site do HIX AI (`https://hix.ai/chat`), enviar a pergunta e capturar a resposta.
- Implementa cache em memória para evitar requisições repetidas.
- Salva prints (`resposta-final.png`, `login-page.png`, etc.) para ajudar a depuração quando algo não funciona.

## 🚀 Executando o projeto

### 1) Instalar dependências

No diretório raiz do projeto (onde está o `package.json`):

```bash
npm install
```

### 2) Rodar o servidor

```bash
node backend/server.js
```

O servidor irá ficar disponível em `http://localhost:3000` e a interface em `http://localhost:3000/`.

> ⚠️ O backend usa Puppeteer (Chrome) e precisa de uma conexão estável à internet para acessar o HIX AI.

### 3) Usar a interface Nia

Abra o navegador e acesse `http://localhost:3000`. Você pode digitar perguntas e clicar em "Enviar".

## 🛠️ Personalizando as respostas da Nia

As respostas pré-definidas estão no arquivo `backend/public/assistant.js` no objeto `answers`. Você pode adicionar ou alterar as frases para personalizar o comportamento.

## 📄 Estrutura de pastas

- `backend/` - servidor Node.js + recursos estáticos
  - `public/` - frontend da Nia (HTML/CSS/JS)
  - `server.js` - backend que consulta o HIX AI via Puppeteer
- `package.json` - dependências do projeto

---

Se quiser, posso ajudar a adicionar novas habilidades à Nia (por exemplo, integração com APIs de clima, tradução ou exportar histórico).