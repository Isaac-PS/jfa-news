import { gerarSlug } from './slug.js';

export const LIMITE_NOME = 80;
export const LIMITE_FUNCAO = 80;
export const LIMITE_BIO = 600;

export function validarMembro(dados) {
  const erros = [];
  const nome = (dados.nome ?? '').trim();
  const funcao = (dados.funcao ?? '').trim();
  const bio = (dados.bio ?? '').trim();
  if (!nome) erros.push('Informe o nome.');
  else if (nome.length > LIMITE_NOME) erros.push(`O nome pode ter no máximo ${LIMITE_NOME} caracteres.`);
  if (!funcao) erros.push('Informe a função.');
  else if (funcao.length > LIMITE_FUNCAO) erros.push(`A função pode ter no máximo ${LIMITE_FUNCAO} caracteres.`);
  if (bio.length > LIMITE_BIO) erros.push(`A mini bio pode ter no máximo ${LIMITE_BIO} caracteres.`);
  return erros;
}

export function gerarIdMembro(nome, idsExistentes = []) {
  const base = gerarSlug(nome) === 'noticia' ? 'membro' : gerarSlug(nome);
  const usados = new Set(idsExistentes);
  if (!usados.has(base)) return base;
  let numero = 2;
  while (usados.has(`${base}-${numero}`)) numero += 1;
  return `${base}-${numero}`;
}

// O arquivo data/equipe.json antigo não tem ids: eles são derivados do nome, sempre do mesmo jeito.
export function garantirIds(membros) {
  const usados = membros.filter((membro) => membro.id).map((membro) => membro.id);
  return membros.map((membro) => {
    if (membro.id) return { ...membro };
    const id = gerarIdMembro(membro.nome, usados);
    usados.push(id);
    return { id, ...membro };
  });
}

export function buscarMembro(lista, id) {
  return lista.find((membro) => membro.id === id);
}

function normalizar(dados) {
  return {
    nome: dados.nome.trim(),
    funcao: dados.funcao.trim(),
    bio: (dados.bio ?? '').replace(/\r\n/g, '\n').trim(),
    foto: dados.foto ?? null,
  };
}

export function adicionarMembro(lista, dados, id) {
  if (buscarMembro(lista, id)) throw new Error('Já existe um integrante com este identificador.');
  return [...lista, { id, ...normalizar(dados) }];
}

export function atualizarMembro(lista, id, dados) {
  const atual = buscarMembro(lista, id);
  if (!atual) throw new Error('Este integrante não existe mais.');
  return lista.map((membro) =>
    membro.id === id ? { id, ...normalizar({ foto: atual.foto, ...dados }) } : membro,
  );
}

export function removerMembro(lista, id) {
  if (!buscarMembro(lista, id)) throw new Error('Este integrante não existe mais.');
  return lista.filter((membro) => membro.id !== id);
}

export function moverMembro(lista, id, delta) {
  const de = lista.findIndex((membro) => membro.id === id);
  if (de === -1) throw new Error('Este integrante não existe mais.');
  const para = de + delta;
  if (para < 0 || para >= lista.length) return [...lista];
  const nova = [...lista];
  [nova[de], nova[para]] = [nova[para], nova[de]];
  return nova;
}
