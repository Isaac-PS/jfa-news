// Edição do campo de texto da notícia. Todas as funções recebem o valor e a seleção
// (inicio, fim) do textarea e devolvem { valor, inicio, fim }: o painel só aplica o resultado.

export function envolver(valor, inicio, fim, marca, exemplo) {
  const trecho = inicio === fim ? exemplo : valor.slice(inicio, fim);
  const novo = `${valor.slice(0, inicio)}${marca}${trecho}${marca}${valor.slice(fim)}`;
  const comeco = inicio + marca.length;
  return { valor: novo, inicio: comeco, fim: comeco + trecho.length };
}

export function prefixarLinha(valor, inicio, fim, prefixo) {
  const comecoLinha = valor.lastIndexOf('\n', inicio - 1) + 1;
  const tem = valor.startsWith(prefixo, comecoLinha);
  const novo = tem
    ? valor.slice(0, comecoLinha) + valor.slice(comecoLinha + prefixo.length)
    : valor.slice(0, comecoLinha) + prefixo + valor.slice(comecoLinha);
  const delta = tem ? -prefixo.length : prefixo.length;
  return { valor: novo, inicio: Math.max(comecoLinha, inicio + delta), fim: Math.max(comecoLinha, fim + delta) };
}

// Coloca `bloco` em parágrafo próprio (linha em branco antes e depois) e leva o cursor para depois dele.
export function inserirBloco(valor, inicio, fim, bloco) {
  const antes = valor.slice(0, inicio).trimEnd();
  const depois = valor.slice(fim).trimStart();
  const inicioBloco = antes ? `${antes}\n\n` : '';
  const novo = `${inicioBloco}${bloco}\n\n${depois}`;
  const cursor = inicioBloco.length + bloco.length + 2;
  return { valor: novo, inicio: cursor, fim: cursor };
}

export function montarLink(valor, inicio, fim, endereco) {
  const rotulo = inicio === fim ? endereco : valor.slice(inicio, fim);
  const link = `[${rotulo}](${endereco})`;
  const novo = valor.slice(0, inicio) + link + valor.slice(fim);
  const cursor = inicio + link.length;
  return { valor: novo, inicio: cursor, fim: cursor };
}
