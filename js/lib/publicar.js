import { gerarId } from './slug.js';
import { validar, buscar, criarNoticia, editarNoticia, excluirNoticia } from './modelo.js';
import { imagemValida } from './formato.js';
import { imagensDoTexto } from './texto.js';

export const CAMINHO_JSON = 'data/noticias.json';
export const PASTA_IMAGENS = 'assets/noticias/';

export class ErroValidacao extends Error {
  constructor(erros) {
    super(erros.join(' '));
    this.name = 'ErroValidacao';
    this.erros = erros;
  }
}

// Cria (id = null) ou edita (id preenchido) uma notícia.
// Ordem: valida, envia a imagem, grava o JSON e, por último, apaga a imagem antiga.
export async function publicarNoticia({ cliente, dados, id = null, imagemBase64 = null, removerImagem = false }) {
  const erros = validar(dados);
  if (erros.length > 0) throw new ErroValidacao(erros);

  const { dados: atual } = await cliente.lerJson(CAMINHO_JSON);
  const lista = atual.noticias;
  const existente = id ? buscar(lista, id) : null;
  if (id && !existente) throw new Error('Esta notícia não existe mais.');
  const idFinal = id ?? gerarId(dados.data, dados.titulo, lista.map((noticia) => noticia.id));

  let imagem = existente?.imagem ?? null;
  if (removerImagem) imagem = null;
  if (imagemBase64) {
    imagem = `${PASTA_IMAGENS}${idFinal}.jpg`;
    await cliente.enviarArquivo(imagem, imagemBase64, `Imagem da notícia ${idFinal}`);
  }

  const registro = { ...dados, imagem };
  await cliente.atualizarJson(
    CAMINHO_JSON,
    (json) => ({
      ...json,
      noticias: existente
        ? editarNoticia(json.noticias, idFinal, registro)
        : criarNoticia(json.noticias, registro, idFinal),
    }),
    `${existente ? 'Edita' : 'Publica'} notícia: ${dados.titulo}`,
  );

  const avisos = [];
  const imagemAntiga = existente?.imagem;
  // O caminho vem do JSON do repositório: só apaga arquivo dentro da pasta de imagens das notícias.
  if (imagemAntiga && imagemAntiga !== imagem && imagemValida(imagemAntiga, PASTA_IMAGENS)) {
    try {
      await cliente.apagarArquivo(imagemAntiga, `Remove imagem antiga da notícia ${idFinal}`);
    } catch {
      avisos.push('A notícia foi salva, mas não foi possível apagar a imagem antiga.');
    }
  }
  return { id: idFinal, avisos };
}

export async function excluirNoticiaPublicada({ cliente, id }) {
  const { dados: atual } = await cliente.lerJson(CAMINHO_JSON);
  const existente = buscar(atual.noticias, id);
  if (!existente) throw new Error('Esta notícia não existe mais.');

  await cliente.atualizarJson(
    CAMINHO_JSON,
    (json) => ({ ...json, noticias: excluirNoticia(json.noticias, id) }),
    `Exclui notícia: ${existente.titulo}`,
  );

  const avisos = [];
  const arquivos = [];
  if (existente.imagem && imagemValida(existente.imagem, PASTA_IMAGENS)) arquivos.push(existente.imagem);
  arquivos.push(...imagensDoTexto(existente.texto));
  let falhas = 0;
  for (const arquivo of new Set(arquivos)) {
    try {
      await cliente.apagarArquivo(arquivo, `Remove imagem da notícia ${id}`);
    } catch {
      falhas += 1;
    }
  }
  if (falhas > 0) avisos.push('A notícia foi excluída, mas não foi possível apagar algumas imagens.');
  return { avisos };
}
