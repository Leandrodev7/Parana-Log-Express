const CHAVE = "+5541998128497";
const NOME = "Leandro Massuquetto";
const CIDADE = "CURITIBA";

let ultimaEntrega = null;

function crc16(str) {
  let crc = 0xffff;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function campo(id, valor) {
  return id + String(valor.length).padStart(2, "0") + valor;
}

function gerarPix(valor) {
  const merchantAccountInformation =
    campo("00", "BR.GOV.BCB.PIX") + campo("01", CHAVE);

  let payload =
    campo("00", "01") +
    campo("26", merchantAccountInformation) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", valor) +
    campo("58", "BR") +
    campo("59", NOME) +
    campo("60", CIDADE) +
    campo("62", campo("05", "***")) +
    "6304";

  payload += crc16(payload);

  return payload;
}

function formatarReais(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "R$ 0,00";
  }

  return (
    "R$ " +
    numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function lerNumero(id) {
  let valor = document.getElementById(id).value.trim().replace(/\s/g, "");

  if (!valor) {
    return NaN;
  }

  valor = valor.replace(/^R\$/i, "");

  const ultimaVirgula = valor.lastIndexOf(",");
  const ultimoPonto = valor.lastIndexOf(".");

  if (ultimaVirgula !== -1 && ultimoPonto !== -1) {
    valor =
      ultimaVirgula > ultimoPonto
        ? valor.replace(/\./g, "").replace(",", ".")
        : valor.replace(/,/g, "");
  } else if (ultimaVirgula !== -1) {
    valor = valor.replace(",", ".");
  } else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(valor)) {
    valor = valor.replace(/\./g, "");
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : NaN;
}

function calcular() {
  const km = lerNumero("km");

  const diesel = lerNumero("combustivel");

  const consumo = lerNumero("consumo");

  const pedagio = lerNumero("pedagio");

  const outras = lerNumero("outras");

  const valorCobrado = lerNumero("valorCobrado");

  const pedagioPreenchido = document.getElementById("pedagio").value.trim();
  const outrasPreenchidas = document.getElementById("outras").value.trim();

  const valorElemento = document.getElementById("valor");

  const custoElemento = document.getElementById("custo");

  const lucroElemento = document.getElementById("lucro");

  const margemElemento = document.getElementById("margem");

  const pixElemento = document.getElementById("pix");

  const qr = document.getElementById("qr");

  const aviso = document.getElementById("aviso");

  if (
    isNaN(km) ||
    km <= 0 ||
    isNaN(diesel) ||
    diesel <= 0 ||
    isNaN(consumo) ||
    consumo <= 0 ||
    isNaN(valorCobrado) ||
    valorCobrado <= 0 ||
    (pedagioPreenchido && (isNaN(pedagio) || pedagio < 0)) ||
    (outrasPreenchidas && (isNaN(outras) || outras < 0))
  ) {
    alert(
      "Confira os valores informados. Use vírgula nos centavos e ponto para separar milhares.",
    );

    return;
  }

  const pedagioTotal = isNaN(pedagio) ? 0 : pedagio;

  const outrasDespesas = isNaN(outras) ? 0 : outras;

  const litros = km / consumo;

  const custoCombustivel = litros * diesel;

  const custoTotal = custoCombustivel + pedagioTotal + outrasDespesas;

  const lucro = valorCobrado - custoTotal;

  const margem = valorCobrado > 0 ? (lucro / valorCobrado) * 100 : 0;

  valorElemento.innerText = formatarReais(valorCobrado);

  custoElemento.innerText = formatarReais(custoTotal);

  lucroElemento.innerText = formatarReais(lucro);

  margemElemento.innerText = margem.toFixed(2).replace(".", ",") + "%";

  lucroElemento.classList.remove("lucro-positivo", "lucro-negativo");

  if (lucro >= 0) {
    lucroElemento.classList.add("lucro-positivo");
  } else {
    lucroElemento.classList.add("lucro-negativo");
  }

  const valorFormatado = valorCobrado.toFixed(2);

  const payload = gerarPix(valorFormatado);

  pixElemento.innerText = payload;

  qr.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
    encodeURIComponent(payload);

  qr.removeAttribute("hidden");
  pixElemento.removeAttribute("hidden");

  aviso.style.display = "none";

  ultimaEntrega = {
    cliente: document.getElementById("cliente").value,

    origem: document.getElementById("origem").value,

    destino: document.getElementById("destino").value,

    veiculo: document.getElementById("veiculo").value,

    tipoCarga: document.getElementById("tipoCarga").value,

    eixos: document.getElementById("eixos").value,

    km: km,

    diesel: diesel,

    consumo: consumo,

    pedagio: pedagioTotal,

    outras: outrasDespesas,

    valorCobrado: valorCobrado,

    custoCombustivel: custoCombustivel,

    custoTotal: custoTotal,

    lucro: lucro,

    margem: margem,

    data: new Date().toLocaleString("pt-BR"),
  };
}

function salvarEntrega() {
  if (!ultimaEntrega) {
    alert("Calcule uma entrega primeiro!");
    return;
  }

  const entregasSalvas = JSON.parse(localStorage.getItem("entregas")) || [];

  entregasSalvas.push(ultimaEntrega);

  localStorage.setItem("entregas", JSON.stringify(entregasSalvas));

  alert("Entrega salva com sucesso!");

  mostrarHistorico();
}

function cancelarEntrega(index) {
  const confirmou = confirm("Deseja realmente cancelar esta entrega?");

  if (!confirmou) {
    return;
  }

  const entregas = JSON.parse(localStorage.getItem("entregas")) || [];

  entregas.splice(index, 1);

  localStorage.setItem("entregas", JSON.stringify(entregas));

  mostrarHistorico();

  alert("Entrega cancelada com sucesso!");
}

function criarDetalhe(rotulo, valor) {
  const linha = document.createElement("p");
  const nome = document.createElement("strong");
  const conteudo = document.createElement("span");

  nome.textContent = rotulo + ":";
  conteudo.textContent = valor;
  linha.append(nome, conteudo);

  return linha;
}

function mostrarHistorico() {
  const historico = document.getElementById("lista-entregas");

  const entregas = JSON.parse(localStorage.getItem("entregas")) || [];

  if (entregas.length === 0) {
    const vazio = document.createElement("p");
    vazio.textContent = "Nenhuma entrega registrada.";
    historico.replaceChildren(vazio);

    return;
  }

  historico.replaceChildren();

  entregas.forEach((entrega, index) => {
    const item = document.createElement("div");

    item.className = "entrega";

    const lucro = Number(entrega.lucro) || 0;

    const margem = Number(entrega.margem) || 0;

    const diesel = Number(entrega.diesel) || 0;

    const pedagio = Number(entrega.pedagio) || 0;

    const outras = Number(entrega.outras) || 0;

    const valorCobrado =
      Number(entrega.valorCobrado) || Number(entrega.valorEntrega) || 0;

    const custoTotal = Number(entrega.custoTotal) || 0;

    const classeLucro = lucro >= 0 ? "lucro-positivo" : "lucro-negativo";

    const titulo = document.createElement("strong");
    titulo.textContent = `Entrega ${index + 1}`;
    item.appendChild(titulo);

    item.append(
      criarDetalhe("Cliente", entrega.cliente || "Não informado"),
      criarDetalhe(
        "Rota",
        `${entrega.origem || "Não informado"} → ${entrega.destino || "Não informado"}`,
      ),
      criarDetalhe("Veículo", entrega.veiculo || "Não informado"),
      criarDetalhe("Tipo de carga", entrega.tipoCarga || "Não informado"),
      criarDetalhe(
        "Eixos",
        entrega.eixos ? `${entrega.eixos} eixos` : "Não informado",
      ),
      criarDetalhe("Distância", `${entrega.km || 0} km`),
      criarDetalhe("Diesel", `${formatarReais(diesel)}/L`),
      criarDetalhe("Pedágio", formatarReais(pedagio)),
      criarDetalhe("Outras despesas", formatarReais(outras)),
      criarDetalhe("Valor cobrado", formatarReais(valorCobrado)),
      criarDetalhe("Custo", formatarReais(custoTotal)),
    );

    const linhaLucro = criarDetalhe("Lucro", formatarReais(lucro));
    linhaLucro.lastElementChild.className = classeLucro;
    item.append(linhaLucro);
    item.appendChild(
      criarDetalhe("Margem", `${margem.toFixed(2).replace(".", ",")}%`),
    );

    const data = document.createElement("small");
    data.textContent = entrega.data || "Data não informada";
    item.appendChild(data);

    const botaoCancelar = document.createElement("button");
    botaoCancelar.type = "button";
    botaoCancelar.className = "cancelar";
    botaoCancelar.textContent = "Cancelar entrega";
    botaoCancelar.addEventListener("click", () => cancelarEntrega(index));
    item.appendChild(botaoCancelar);

    historico.appendChild(item);
  });
}

function iniciarNovaEntrega() {
  const campos = [
    "cliente",
    "origem",
    "destino",
    "veiculo",
    "tipoCarga",
    "eixos",
    "km",
    "combustivel",
    "consumo",
    "pedagio",
    "outras",
    "valorCobrado",
  ];

  campos.forEach((id) => {
    document.getElementById(id).value = "";
  });

  document.getElementById("valor").innerText = "R$ 0,00";
  document.getElementById("custo").innerText = "R$ 0,00";
  document.getElementById("lucro").innerText = "R$ 0,00";
  document.getElementById("margem").innerText = "0%";
  document
    .getElementById("lucro")
    .classList.remove("lucro-positivo", "lucro-negativo");

  const qr = document.getElementById("qr");
  qr.setAttribute("hidden", "");
  qr.removeAttribute("src");

  const pix = document.getElementById("pix");
  pix.textContent = "";
  pix.setAttribute("hidden", "");

  document.getElementById("aviso").style.display = "";
  ultimaEntrega = null;
}

document.querySelectorAll('a[href="#nova-entrega"]').forEach((atalho) => {
  atalho.addEventListener("click", iniciarNovaEntrega);
});

document.getElementById("btn").addEventListener("click", calcular);

document.getElementById("salvar").addEventListener("click", salvarEntrega);

document.getElementById("copiar").addEventListener("click", async function () {
  const textoPix = document.getElementById("pix").innerText;

  if (textoPix.length < 10) {
    alert("Calcule primeiro!");
    return;
  }

  try {
    await navigator.clipboard.writeText(textoPix);

    alert("PIX copiado!");
  } catch (erro) {
    alert("Não foi possível copiar automaticamente.");
  }
});
function exportarBackup() {
  const entregas = JSON.parse(localStorage.getItem("entregas")) || [];

  if (entregas.length === 0) {
    alert("Não existem entregas para exportar.");
    return;
  }

  const dados = JSON.stringify(entregas, null, 2);

  const arquivo = new Blob([dados], { type: "application/json" });

  const url = URL.createObjectURL(arquivo);

  const link = document.createElement("a");

  const data = new Date().toISOString().slice(0, 10);

  link.href = url;

  link.download = `parana-log-backup-${data}.json`;

  link.click();

  URL.revokeObjectURL(url);

  alert("Backup exportado com sucesso!");
}

function selecionarBackup() {
  document.getElementById("arquivoBackup").click();
}

function importarBackup(evento) {
  const arquivo = evento.target.files[0];

  if (!arquivo) {
    return;
  }

  const leitor = new FileReader();

  leitor.onload = function () {
    try {
      const dados = JSON.parse(leitor.result);

      if (!Array.isArray(dados)) {
        throw new Error("Formato inválido");
      }

      const confirmou = confirm(
        "Deseja restaurar este backup? " +
          "As entregas atuais serão substituídas.",
      );

      if (!confirmou) {
        evento.target.value = "";
        return;
      }

      localStorage.setItem("entregas", JSON.stringify(dados));

      mostrarHistorico();

      alert("Backup restaurado com sucesso!");
    } catch (erro) {
      alert("Não foi possível importar o backup.");
    }

    evento.target.value = "";
  };

  leitor.readAsText(arquivo);
}

document
  .getElementById("exportarBackup")
  .addEventListener("click", exportarBackup);

document
  .getElementById("importarBackup")
  .addEventListener("click", selecionarBackup);

document
  .getElementById("arquivoBackup")
  .addEventListener("change", importarBackup);

mostrarHistorico();
