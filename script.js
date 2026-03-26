const quantidadeInput = document.getElementById("quantidade");
const minimoInput = document.getElementById("minimo");
const maximoInput = document.getElementById("maximo");
const naoRepetirInput = document.getElementById("naoRepetir");
const sortearBtn = document.getElementById("sortearBtn");
const sortearNovamenteBtn = document.getElementById("sortearNovamenteBtn");
const cardSorteio = document.querySelector(".card-sorteio");
const resultadoSection = document.querySelector(".resultado");
const resultadoDiv = document.getElementById("resultado");
const mensagem = document.getElementById("mensagem");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let sorteioAtual = 0;

sortearBtn.onclick = sortear;
sortearNovamenteBtn.onclick = voltarParaEstadoInicial;

aplicarEstadoInicial();

function aplicarEstadoInicial() {
  cardSorteio.classList.remove("is-hidden");
  resultadoSection.classList.remove("is-active");
  sortearNovamenteBtn.classList.remove("is-visible");
}

function aplicarEstadoResultado() {
  cardSorteio.classList.add("is-hidden");
  resultadoSection.classList.add("is-active");
  sortearNovamenteBtn.classList.add("is-visible");
}

function limparResultados() {
  resultadoDiv.replaceChildren();
}

function setMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.classList.remove("mensagem--erro", "mensagem--sucesso");

  if (tipo) {
    mensagem.classList.add(`mensagem--${tipo}`);
  }
}

function setBotaoEstado(emExecucao) {
  sortearBtn.disabled = emExecucao;
  sortearBtn.setAttribute("aria-busy", String(emExecucao));
  sortearNovamenteBtn.disabled = emExecucao;
  sortearNovamenteBtn.setAttribute("aria-busy", String(emExecucao));
}

function esperar(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function numeroAleatorio(minimo, maximo) {
  return Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
}

function validarCampos() {
  const quantidadeStr = quantidadeInput.value.trim();
  const minimoStr = minimoInput.value.trim();
  const maximoStr = maximoInput.value.trim();
  const naoRepetir = naoRepetirInput.checked;

  if (quantidadeStr === "" || minimoStr === "" || maximoStr === "") {
    return { erro: "Preencha todos os campos!" };
  }

  const quantidade = Number.parseInt(quantidadeStr, 10);
  const minimo = Number.parseInt(minimoStr, 10);
  const maximo = Number.parseInt(maximoStr, 10);

  if (Number.isNaN(quantidade) || Number.isNaN(minimo) || Number.isNaN(maximo)) {
    return { erro: "Informe apenas números válidos." };
  }

  if (quantidade <= 0) {
    return { erro: "A quantidade deve ser maior que zero." };
  }

  if (maximo <= minimo) {
    return { erro: "O valor máximo deve ser maior que o mínimo." };
  }

  const intervalo = maximo - minimo + 1;

  if (naoRepetir && quantidade > intervalo) {
    return { erro: "Quantidade maior que o intervalo disponível!" };
  }

  return {
    quantidade,
    minimo,
    maximo,
    naoRepetir,
  };
}

async function sortear() {
  const validacao = validarCampos();

  if (validacao.erro) {
    setMensagem(validacao.erro, "erro");
    return;
  }

  const { quantidade, minimo, maximo, naoRepetir } = validacao;
  const idExecucao = ++sorteioAtual;

  limparResultados();
  aplicarEstadoResultado();
  setBotaoEstado(true);
  setMensagem("Sorteando...", "sucesso");

  try {
    const numeros = gerarNumeros(quantidade, minimo, maximo, naoRepetir);
    await exibirResultados(numeros, minimo, maximo, idExecucao);

    if (idExecucao === sorteioAtual) {
      setMensagem("Sorteio concluído!", "sucesso");
      setBotaoEstado(false);
    }
  } catch (erro) {
    if (idExecucao === sorteioAtual) {
      aplicarEstadoInicial();
      limparResultados();
      setMensagem("Não foi possível concluir o sorteio.", "erro");
      setBotaoEstado(false);
    }
  }
}

function voltarParaEstadoInicial() {
  sorteioAtual += 1;
  limparResultados();
  setMensagem("");
  aplicarEstadoInicial();
  setBotaoEstado(false);
}

function gerarNumeros(quantidade, minimo, maximo, naoRepetir) {
  if (naoRepetir) {
    const todos = [];

    for (let i = minimo; i <= maximo; i += 1) {
      todos.push(i);
    }

    for (let i = todos.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [todos[i], todos[j]] = [todos[j], todos[i]];
    }

    return todos.slice(0, quantidade);
  }

  const numeros = [];
  const intervalo = maximo - minimo + 1;

  for (let i = 0; i < quantidade; i += 1) {
    numeros.push(Math.floor(Math.random() * intervalo) + minimo);
  }

  return numeros;
}

async function exibirResultados(numeros, minimo, maximo, idExecucao) {
  const reducedMotion = motionQuery.matches;

  for (let index = 0; index < numeros.length; index += 1) {
    if (idExecucao !== sorteioAtual) {
      return;
    }

    const numeroFinal = numeros[index];
    const span = document.createElement("span");
    span.className = "numero rolling";
    span.textContent = numeroAleatorio(minimo, maximo);
    resultadoDiv.appendChild(span);

    if (reducedMotion) {
      span.textContent = numeroFinal;
      span.classList.remove("rolling");
      span.classList.add("show");
    } else {
      await animarNumero(span, numeroFinal, minimo, maximo, idExecucao);
    }

    if (!reducedMotion && index < numeros.length - 1) {
      await esperar(140);
    }
  }
}

async function animarNumero(elemento, numeroFinal, minimo, maximo, idExecucao) {
  const duracao = 420;
  const intervalo = 55;
  const inicio = performance.now();

  while (performance.now() - inicio < duracao) {
    if (idExecucao !== sorteioAtual) {
      return;
    }

    elemento.textContent = numeroAleatorio(minimo, maximo);
    await esperar(intervalo);
  }

  if (idExecucao !== sorteioAtual) {
    return;
  }

  elemento.textContent = numeroFinal;
  elemento.classList.remove("rolling");

  requestAnimationFrame(() => {
    elemento.classList.add("animate", "show");
  });

  await esperar(180);
}
