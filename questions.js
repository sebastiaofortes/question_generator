var selLang = "en-US"
var perguntasGlobal;

async function IniciarProcesso() {
    // Coletando a pergunta
    var inputElement = document.getElementById('chat-input');
    var sQuestion = inputElement.value;

    // Validando se o texto está vazio
    if (sQuestion === "") {
        alert("Por favor, insira um texto");
        return
    }

    inputElement.value = '';

    var objetoJson = await EnviarParaChatGPT(sQuestion);
    perguntasGlobal = objetoJson;

    gerarPaginaDePerguntas(objetoJson);

}

async function EnviarParaChatGPT(texto) {
    var OPENAI_API_KEY = document.getElementById("OpenAiKey").value;
    const sQuestion = `Com base no texto abaixo, gere o json puro e sem formatação de um quiz com 5 perguntas com base no conteúdo do texto, o json deve estar no formato: { "questions": [{"question":"x", "answers": ["X", "X", "X"], "correctAnswer": "X"}]} Texto: ${texto}`;

    const sModel = "gpt-4-turbo-preview";
    const iMaxTokens = 2048;
    const dTemperature = 0;

    const data = {
        model: sModel,
        messages: [{ "role": "user", "content": sQuestion }],
        max_tokens: iMaxTokens,
        temperature: dTemperature
        // Os comentários sobre frequency_penalty, presence_penalty e stop foram omitidos por brevidade
    };

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const oJson = await response.json();

        console.log(oJson);

        if (txtOutput.value != "") txtOutput.value += "\n";
        txtOutput.value += "Requisição: " + sQuestion;

        if (oJson.error && oJson.error.message) {
            txtOutput.value += "Error: " + oJson.error.message;
        } else if (oJson.choices && oJson.choices[0].message) {
            let s = oJson.choices[0].message.content;

            //remove todos os caracteres ``` da resposta 
            s = s.replace(/`/g, '');

            //remove a palavra "json" da resposta 
            s = s.replace(/^json/, '');

            if (s === "") s = "No response";
            txtOutput.value += "Chat GPT: " + s;

            const objetoJson = JSON.parse(s);
            return objetoJson;
        }
    } catch (error) {
        console.error("Error: ", error);
        txtOutput.value += "\nError: " + error.message;
    }
}

function gerarPaginaDePerguntas(perguntasJson) {
    const perguntas = perguntasJson.questions;
    const formulario = document.createElement("form");

    perguntas.forEach((pergunta, indice) => {
        // Criar o elemento de pergunta
        const divPergunta = document.createElement("div");
        divPergunta.classList.add("pergunta");
        const labelPergunta = document.createElement("label");
        labelPergunta.textContent = `Pergunta ${indice + 1}: ${pergunta.question}`;
        divPergunta.appendChild(labelPergunta);

        // Criar as opções de resposta
        const divOpcoes = document.createElement("div");
        divOpcoes.classList.add("opcoes");
        pergunta.answers.forEach((opcao, indiceOpcao) => {
            const divOpcao = document.createElement("div");
            const inputOpcao = document.createElement("input");
            inputOpcao.type = "radio";
            inputOpcao.name = `pergunta${indice}`;
            inputOpcao.id = `pergunta${indice}_opcao${indiceOpcao}`;
            inputOpcao.value = opcao;
            const labelOpcao = document.createElement("label");
            labelOpcao.htmlFor = `pergunta${indice}_opcao${indiceOpcao}`;
            labelOpcao.textContent = opcao;
            divOpcao.appendChild(inputOpcao);
            divOpcao.appendChild(labelOpcao);
            divOpcoes.appendChild(divOpcao);
        });
        divPergunta.appendChild(divOpcoes);
        formulario.appendChild(divPergunta);
    });

    // Adicionar botão de envio
    const botaoEnviar = document.createElement("h1");
    botaoEnviar.addEventListener("click", Corrigir);
    botaoEnviar.textContent = "Enviar";
    formulario.appendChild(botaoEnviar);


    // Adicionar formulário à página
    const divFormulario = document.createElement("div");
    divFormulario.classList.add("formulario");
    divFormulario.appendChild(formulario);
    document.body.appendChild(divFormulario);
}

function Corrigir(event) {

    minhasRespostas = GetRespostasUsuario();

    const perguntasERespostasParaVerificacao = perguntasGlobal.questions;

    VerificarRespostas(perguntasERespostasParaVerificacao, minhasRespostas);


}

function GetRespostasUsuario() {
    const meuArray = [];
    const radiosCheckados = document.querySelectorAll('input[type="radio"]:checked');
    radiosCheckados.forEach((resposta, indice) => {
        const meuObjeto = {
            indice: resposta.id.charAt(8),
            valor: resposta.value
        };

        meuArray.push(meuObjeto);
    });
    return meuArray;
}

function VerificarRespostas(perguntasVerificacao, meuArray) {
    perguntasVerificacao.forEach((pergunta, indice) => {
        EscreverRespostas("Questão: " + indice + " - resposta correta:" + pergunta.correctAnswer)
        meuArray.forEach((resp, ord) => {
            if (indice == resp.indice) {

                EscreverRespostas("Questão: " + resp.indice + " Minha resposta: " + resp.valor);


                if (pergunta.correctAnswer === resp.valor) {
                    EscreverRespostas("vc acertou");
                } else {
                    EscreverRespostas("vc errou");
                }

            }
        });
    });
}

function EscreverRespostas(prefix) {
    const resultadoDiv = document.getElementById("resultadoDiv");
    const resultadoP = document.createElement("p");
    resultadoP.textContent = prefix;
    resultadoDiv.appendChild(resultadoP);
}