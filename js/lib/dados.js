// Carrega um arquivo JSON do próprio site, pedindo ao navegador que revalide o cache
// para que uma notícia nova apareça assim que o GitHub Pages terminar de publicar.
export async function carregarJson(caminho, fetchFn = fetch) {
  const resposta = await fetchFn(caminho, { cache: 'no-cache' });
  if (!resposta.ok) throw new Error(`Falha ao carregar ${caminho} (${resposta.status})`);
  return resposta.json();
}
