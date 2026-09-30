export const LIMITE_RESUMO = 160;
export const LIMITE_TITULO = 120;

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(texto) {
  if (!DATA_ISO.test(texto)) return false;
  const data = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

export function validar(dados) {
  const erros = [];
  const titulo = (dados.titulo ?? '').trim();
  const resumo = (dados.resumo ?? '').trim();
  const texto = (dados.texto ?? '').trim();

  if (!titulo) erros.push('Informe o título.');
  else if (titulo.length > LIMITE_TITULO) erros.push(`O título pode ter no máximo ${LIMITE_TITULO} caracteres.`);
  if (!dataValida(dados.data ?? '')) erros.push('Informe uma data válida.');
  if (resumo.length > LIMITE_RESUMO) erros.push(`O resumo pode ter no máximo ${LIMITE_RESUMO} caracteres.`);
  if (!texto) erros.push('Escreva o texto da notícia.');
  return erros;
}

export function ordenar(lista) {
  return [...lista].sort((a, b) => {
    if (a.data < b.data) return 1;
    if (a.data > b.data) return -1;
    return 0;
  });
}

export function buscar(lista, id) {
  return lista.find((noticia) => noticia.id === id);
}

function normalizar(dados) {
  return {
    titulo: dados.titulo.trim(),
    autor: (dados.autor ?? '').trim(),
    data: dados.data,
    resumo: (dados.resumo ?? '').trim(),
    texto: dados.texto.replace(/\r\n/g, '\n').trim(),
    imagem: dados.imagem ?? null,
  };
}

export function criarNoticia(lista, dados, id) {
  if (buscar(lista, id)) throw new Error('Já existe uma notícia com este identificador.');
  return [{ id, ...normalizar(dados) }, ...lista];
}

export function editarNoticia(lista, id, dados) {
  const atual = buscar(lista, id);
  if (!atual) throw new Error('Esta notícia não existe mais.');
  return lista.map((noticia) =>
    noticia.id === id ? { id, ...normalizar({ imagem: atual.imagem, ...dados }) } : noticia,
  );
}

export function excluirNoticia(lista, id) {
  if (!buscar(lista, id)) throw new Error('Esta notícia não existe mais.');
  return lista.filter((noticia) => noticia.id !== id);
}
