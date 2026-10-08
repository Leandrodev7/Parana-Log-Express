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

  if (isNaN(numero)) {
    return "R$ 0,00";
  }

  return "R$ " + numero.toFixed(2).replace(".", ",");
}

function calcular() {
  const km = parseFloat(document.getElementById("km").value);

  const diesel = parseFloat(document.getElementById("combustivel").value);

  const consumo = parseFloat(document.getElementById("consumo").value);

  const pedagio = parseFloat(document.getElementById("pedagio").value);

  const outras = parseFloat(document.getElementById("outras").value);

  const valorCobrado = parseFloat(
    document.getElementById("valorCobrado").value,
  );

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
    valorCobrado <= 0
  ) {
    alert("Preencha KM, diesel, consumo e valor cobrado pelo frete.");

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

  qr.style.display = "block";

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

function mostrarHistorico() {
  const historico = document.getElementById("historico");

  const entregas = JSON.parse(localStorage.getItem("entregas")) || [];

  if (entregas.length === 0) {
    historico.innerHTML = "<p>Nenhuma entrega registrada.</p>";

    return;
  }

  historico.innerHTML = "";

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

    item.innerHTML = `
      <strong>Entrega ${index + 1}</strong>

      <p>
        <strong>Cliente:</strong>
        ${entrega.cliente || "Não informado"}
      </p>

      <p>
        <strong>Rota:</strong>
        ${entrega.origem || "Não informado"}
        →
        ${entrega.destino || "Não informado"}
      </p>

      <p>
        <strong>Veículo:</strong>
        ${entrega.veiculo || "Não informado"}
      </p>

      <p>
        <strong>Tipo de carga:</strong>
        ${entrega.tipoCarga || "Não informado"}
      </p>

      <p>
        <strong>Eixos:</strong>
        ${entrega.eixos ? entrega.eixos + " eixos" : "Não informado"}
      </p>

      <p>
        <strong>Distância:</strong>
        ${entrega.km || 0} km
      </p>

      <p>
        <strong>Diesel:</strong>
        ${formatarReais(diesel)}/L
      </p>

      <p>
        <strong>Pedágio:</strong>
        ${formatarReais(pedagio)}
      </p>

      <p>
        <strong>Outras despesas:</strong>
        ${formatarReais(outras)}
      </p>

      <p>
        <strong>Valor cobrado:</strong>
        ${formatarReais(valorCobrado)}
      </p>

      <p>
        <strong>Custo:</strong>
        ${formatarReais(custoTotal)}
      </p>

      <p>
        <strong>Lucro:</strong>
        <span class="${classeLucro}">
          ${formatarReais(lucro)}
        </span>
      </p>

      <p>
        <strong>Margem:</strong>
        ${margem.toFixed(2).replace(".", ",")}%
      </p>

      <small>
        ${entrega.data || "Data não informada"}
      </small>
    `;

    historico.appendChild(item);
  });
}

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

mostrarHistorico();
