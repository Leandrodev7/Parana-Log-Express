# Paraná Log Express

Aplicação web para calcular custos de frete e organizar entregas.

## O que a aplicação faz

- Estima o custo de combustível a partir da distância, do consumo e do preço do diesel.
- Soma pedágios e outras despesas informadas.
- Compara o custo da viagem com o valor cobrado e apresenta lucro e margem estimados.
- Salva entregas no navegador e permite consultar, cancelar, exportar e importar o histórico.
- Gera um código PIX e um QR Code com o valor informado para o frete.

## Como usar

Abra `index.html` em um navegador, preencha os dados da entrega e selecione **Calcular entrega**. Para guardar o cálculo no histórico deste navegador, selecione **Salvar entrega**.

O histórico fica no armazenamento local do navegador. Use **Exportar backup** para guardar uma cópia dos dados. A importação substitui o histórico atual, mediante confirmação.

## Tecnologias

- HTML, CSS e JavaScript
- `localStorage` para o histórico
- Umami Analytics para acompanhamento de visitas
- QRServer para gerar a imagem do QR Code PIX

## Links

- **Aplicação publicada:** https://parana-log-express.leandromassuquetto.workers.dev/
- **Repositório:** https://github.com/Leandrodev7/Parana-Log-Express

O projeto é uma ferramenta de estimativa: os valores dependem dos dados informados e dos custos incluídos no cálculo.
