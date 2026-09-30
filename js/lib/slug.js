const TAMANHO_MAXIMO = 60;

export function gerarSlug(titulo) {
  const base = String(titulo ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, TAMANHO_MAXIMO)
    .replace(/-+$/g, '');
  return base || 'noticia';
}

export function gerarId(dataIso, titulo, idsExistentes = []) {
  const base = `${dataIso}-${gerarSlug(titulo)}`;
  const usados = new Set(idsExistentes);
  if (!usados.has(base)) return base;
  let numero = 2;
  while (usados.has(`${base}-${numero}`)) numero += 1;
  return `${base}-${numero}`;
}
