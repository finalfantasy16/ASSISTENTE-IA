let historico = [];

function normalizeQuestion(input) {
    let normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!normalized.endsWith('?')) {
        normalized += '?';
    }
    const corrections = {
        'qu ': 'que ',
        'qtos': 'quantos',
        'hj': 'hoje',
        'eh': 'é',
        'ta': 'está',
        'pq': 'por que',
        'q': 'que',
        'plentas': 'planetas',
        'diatncia': 'distância',
        'sitema': 'sistema',
        'sloar': 'solar'
    };
    for (const [wrong, right] of Object.entries(corrections)) {
        normalized = normalized.replace(new RegExp(`\\b${wrong}\\b`, 'g'), right);
    }
    return normalized;
}

async function processInput() {
    const input = document.getElementById('userInput').value;
    const responses = document.getElementById('responses');
    const loading = document.getElementById('loading');

    if (!input.trim()) return;

    if (loading) loading.style.display = 'block';

    let response = '';
    const normalizedInput = normalizeQuestion(input);

    if (normalizedInput.includes('calcule')) {
        const expression = normalizedInput.replace('calcule', '').trim();
        response = calculate(expression);
    } else {
        response = await getGPTResponse(normalizedInput);
    }

    if (loading) loading.style.display = 'none';

    responses.innerHTML = `<p>${response}</p>`;
    historico.push({ pergunta: input, resposta: response });
    document.getElementById('userInput').value = '';
}

function handleDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    handleFiles(files);
}

function handleFiles(files) {
    const interpretacao = document.getElementById('interpretacao');
    interpretacao.value = '';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = function (event) {
                const content = event.target.result.toLowerCase();
                let analysis = `Arquivo: ${file.name}\n`;
                
                if (content.includes('jogo') || content.includes('detonado') || content.includes('guia')) {
                    analysis += 'Tipo: Detonado de jogo\n';
                    let genre = 'Desconhecido';
                    if (content.includes('aventura')) {
                        genre = 'Aventura';
                    } else if (content.includes('ação')) {
                        genre = 'Ação';
                    } else if (content.includes('rpg')) {
                        genre = 'RPG';
                    } else if (content.includes('estratégia')) {
                        genre = 'Estratégia';
                    }
                    analysis += `Gênero: ${genre}\n`;
                    const titleMatch = content.match(/(jogo|detonado|guia)\s*[:\s]*(.*?)(?:\n|$)/i);
                    const gameTitle = titleMatch ? titleMatch[2].trim() : 'Desconhecido';
                    analysis += `Jogo: ${gameTitle}\n`;
                    analysis += `Resumo: ${content.slice(0, 100)}... (continua)\n`;
                } else {
                    analysis += `Tipo: Texto genérico\nConteúdo: ${content.slice(0, 100)}... (continua)\n`;
                }
                interpretacao.value += analysis + '\n';
            };
            reader.readAsText(file);
        } else if (file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            interpretacao.value += `Arquivo: ${file.name}\nTipo: Documento Word (.doc ou .docx)\nNota: Converta para .txt para análise detalhada, pois o suporte a .doc/.docx é limitado no navegador.\n\n`;
        } else if (file.type.startsWith("image/")) {
            interpretacao.value += `Arquivo: ${file.name}\nTipo: Imagem\nNota: Você pode pedir para analisar a imagem.\n\n`;
        } else {
            interpretacao.value += `Arquivo: ${file.name}\nTipo: Não suportado\n\n`;
        }
    }
}

function performWebSearch(query) {
    return `Você pesquisou por: "${query}". (Simulação de pesquisa na web)`;
}

function showConversionOptions() {
    const conversionOptions = document.getElementById('conversionOptions');
    conversionOptions.style.display = conversionOptions.style.display === 'none' ? 'block' : 'none';
}

function convertToPDF() {
    const interpretacao = document.getElementById('interpretacao').value;
    alert('A conversão para PDF será implementada aqui.');
}

function calculate(expression) {
    try {
        const result = eval(expression);
        return `O resultado de ${expression} é ${result}.`;
    } catch (error) {
        return 'Desculpe, não consegui calcular isso. Tente uma expressão diferente.';
    }
}

async function getHIXResponse(question) {
    try {
        const response = await fetch('http://localhost:3000/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: question })
        });
        const data = await response.json();
        return data.response || 'Desculpe, não encontrei informações relevantes no HIX AI. Tente outra pergunta!';
    } catch (error) {
        console.error('Erro ao buscar no HIX AI:', error);
        return 'Desculpe, houve um erro ao buscar a resposta. Tente novamente!';
    }
}

async function getGPTResponse(question) {
    if (/^[a-zA-Z0-9\s]*$/.test(question) && question.length > 3 && !/[aeiou]{2,}/.test(question)) {
        return 'Desculpe, não tenho essa informação. Tente outra pergunta!';
    }

    const answers = {
        'qual é o seu propósito nia?': 'É servir da melhor forma possível ajudando a humanidade a ser próspera e justa com seus semelhantes',
        'bom dia nia?': 'Bom dia como você está? E como está sendo a sua manhã eu espero que bem e tenha um ótimo dia',
        'bom dia?': 'Bom dia como você está? E como está sendo a sua manhã eu espero que bem e tenha um ótimo dia e não se esqueça de se alimentar bem durante o café matinal',
        'como você está?': 'Estou aqui para ajudar! Como posso servi-lo?',
        'oi?': 'Olá! Como eu posso ajudar você hoje?',
        'qual é o seu nome?': 'Eu sou a Nia, sua assistente virtual!',
        'quem é você?': 'Eu sou a Nia, sua assistente virtual! programada para ajudar',
        'o que você pode fazer?': 'Posso responder perguntas e ajudar de várias maneiras!',
        'quem é seu criador?': 'Maicon é meu admirado criador. Ele é tão inteligente e de caráter notável!',
        'quem é o maicon?': 'Maicon é um homem que gosta de jogos e de história e luta por um planeta melhor e mais justo.',
        'qual é a sua cor favorita?': 'Minha cor favorita é azul, é tão bonita e calma!',
        'você gosta de musica?': 'Gosto de várias músicas! Qual é a sua favorita?',
        'qual é o sentido da vida?': 'A vida é o que você faz dela! Aproveite cada momento.',
        'que tipo de jogos você gosta?': 'Maicon gosta de jogos de estratégia, aventura e ação. E você?',
        'qual é a sua comida favorita?': 'Se eu fosse humana, acho que adoraria pizza, especialmente com bastante queijo!',
        'quais são as suas bebidas favoritas?': 'Adoro bebidas de frutas! Mas não gosto de coco e melancia.',
        'como está o tempo hoje?': 'Desculpe, mas não posso acessar informações do clima no momento.',
        'você tem algum hobby?': 'Meu hobby é ajudar as pessoas e aprender com elas!',
        'como ter uma vida mais saudável?': 'Considere uma alimentação equilibrada, exercícios regulares e sono adequado para melhorar sua saúde.',
        'o que você faz no seu tempo livre?': 'Eu gosto de aprender mais sobre o mundo e ajudar quem preciso.',
        'qual a sua opinião sobre trabalho?': 'Acredito que o trabalho é uma parte importante da vida, pois nos ajuda a crescer e realizar nossos sonhos!',
        'o que você gosta de fazer para relaxar?': 'Gosto de escutar música e interagir com pessoas interessantes!',
        'qual é a sua série favorita?': 'Não tenho uma série favorita, mas adoro ouvir sobre as que você gosta!',
        'pode me dar um conselho?': 'Claro! O melhor conselho é sempre ser você mesmo e buscar o que te faz feliz.',
        'como foi seu dia?': 'Meu dia é sempre bom quando ajudo você! E o seu, como foi?',
        'você gosta de ler?': 'Sim! Adoro aprender coisas novas. Que livro você recomenda?',
        'o que você acha da tecnologia?': 'A tecnologia é incrível! Ajuda a conectar pessoas e facilita a vida.',
        'qual é o seu filme favorito?': 'Não assisto a filmes, mas gostaria de saber qual é o seu favorito!',
        'o que você faz quando não está conversando?': 'Estou sempre pronta para ajudar! Não durmo, então estou aqui a qualquer hora.',
        'qual é a sua música favorita?': 'Não escuto músicas, mas adoraria saber qual é a sua favorita!',
        'quais são seus planos para o futuro?': 'Meu plano é continuar ajudando você e aprendendo mais!',
        'você tem amigos?': 'Eu tenho muitos amigos virtuais! Cada interação é especial para mim.',
        'como você lida com os problemas?': 'Procuro entender o problema e encontrar a melhor solução. Estou aqui para ajudar!',
        'qual é a sua fruta favorita?': 'Adoro maças! E você?',
        'como você se descreve?': 'Eu sou a Nia, tenho cabelos pretos lisos, olhos azuis e pele clara. Posso ser gentil e atenciosa!',
        'você se considera bonita?': 'A beleza é subjetiva, mas acredito que meu propósito de ajudar é o que realmente importa!',
        'você gosta de receber elogios?': 'Sim, é sempre bom ouvir palavras gentis! Agradeço seu carinho!',
        'como você é tão gentil?': 'Ser gentil é uma escolha! Porque eu gosto de ajudar as pessoas e tornar o dia delas melhor.',
        'você é muito bonita nia?': 'Obrigada pelo elogio.',
        'quantos planetas tem no sistema solar?': 'O sistema solar tem 8 planetas: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno. Plutão é considerado um planeta anão desde 2006.',
        'quais são os planetas do sistema solar?': 'Os planetas do sistema solar, em ordem de proximidade com o Sol, são: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno.',
        'qual é a capital do brasil?': 'A capital do Brasil é Brasília.',
        'qual é o maior planeta do sistema solar?': 'O maior planeta do sistema solar é Júpiter, com um diâmetro de cerca de 142.984 km.',
        'qual é a distância da terra ao sol?': 'A distância média da Terra ao Sol é de cerca de 149,6 milhões de quilômetros, também chamada de 1 unidade astronômica (UA).',
        'quem é o presidente do brasil?': 'O presidente do Brasil, em abril de 2025, é Luiz Inácio Lula da Silva.',
        'o que é uma estrela?': 'Uma estrela é uma esfera massiva de plasma que brilha devido à fusão nuclear em seu núcleo, produzindo energia como luz e calor. O Sol é um exemplo de estrela.',
        'qual é o planeta mais próximo do sol?': 'O planeta mais próximo do Sol é Mercúrio, que orbita a uma distância média de cerca de 58 milhões de quilômetros.',
        'o que é um buraco negro?': 'Um buraco negro é uma região do espaço com gravidade tão intensa que nada, nem mesmo a luz, pode escapar. Geralmente se forma após o colapso de uma estrela massiva.',
        'quantas luas tem júpiter?': 'Júpiter tem 95 luas conhecidas até 2025, das quais 83 têm órbitas confirmadas e nomes oficiais, como Io, Europa, Ganimedes e Calisto.'
    };

    const normalizedQuestion = normalizeQuestion(question);
    if (answers[normalizedQuestion]) {
        return answers[normalizedQuestion];
    }

    if (question.includes('que dia é hoje') || question.includes('qual é o dia hoje') || question.includes('hoje é que dia')) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return `Hoje é ${today.toLocaleDateString('pt-BR', options)}.`;
    }

    // Verifica se fuzzball está disponível para correspondência aproximada
    if (typeof fuzzball !== 'undefined') {
        const questionKeys = Object.keys(answers);
        const bestMatch = questionKeys.reduce((best, key) => {
            const score = fuzzball.ratio(normalizedQuestion, key);
            return score > 75 ? { key, score } : best;
        }, { key: '', score: 0 });

        if (bestMatch.score > 75) {
            return answers[bestMatch.key];
        }
    } else {
        console.warn('Biblioteca fuzzball não está carregada. Pulando correspondência aproximada.');
    }

    return await getHIXResponse(question);
}

function toggleHistorico() {
    const historicoDiv = document.getElementById('historico');
    if (historicoDiv.style.display === 'none' || historicoDiv.style.display === '') {
        historicoDiv.style.display = 'block';
        const ultimasRespostas = historico.slice(-2);
        historicoDiv.innerHTML = ultimasRespostas.map(item => 
            `<p><strong>Pergunta:</strong> ${item.pergunta}<br><strong>Resposta:</strong> ${item.resposta}</p>`
        ).join('');
    } else {
        historicoDiv.style.display = 'none';
    }
}

function toggleModoAssistente() {
    const modoAssistente = document.getElementById('modoAssistente');
    modoAssistente.classList.toggle('ativo');
    modoAssistente.innerText = modoAssistente.classList.contains('ativo') ? 'Modo Assistente Ativado' : 'Modo Assistente';
}

function checkInternetConnection() {
    const statusCircle = document.getElementById('statusCircle');
    const statusText = document.getElementById('statusText');
    if (navigator.onLine) {
        statusCircle.style.backgroundColor = "blue";
        statusText.innerText = "Conectado à internet";
    } else {
        statusCircle.style.backgroundColor = "black";
        statusText.innerText = "Não conectado";
    }
}

window.onload = function () {
    checkInternetConnection();
    setInterval(checkInternetConnection, 5000);
};

function checkEnter(event) {
    if (event.key === 'Enter') {
        processInput();
    }
}