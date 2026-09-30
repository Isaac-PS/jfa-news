// Divide o texto de uma notícia em parágrafos. Linha em branco separa parágrafos;
// quebras simples ficam dentro do parágrafo e o CSS as exibe (white-space: pre-line).
// O resultado é sempre texto puro: quem exibe deve usar textContent.
export function paragrafos(texto) {
  return String(texto ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}
