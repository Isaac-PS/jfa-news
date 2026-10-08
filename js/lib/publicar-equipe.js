import {
  validarMembro, garantirIds, buscarMembro, gerarIdMembro, adicionarMembro, atualizarMembro, removerMembro, moverMembro,
} from './equipe.js';
import { ErroValidacao } from './publicar.js';
import { imagemValida } from './formato.js';

export const CAMINHO_EQUIPE = 'data/equipe.json';
export const PASTA_FOTOS = 'assets/equipe/';

const membrosDe = (json) => garantirIds(Array.isArray(json?.membros) ? json.membros : []);

export async function lerEquipe(cliente) {
  const { dados } = await cliente.lerJson(CAMINHO_EQUIPE);
  return membrosDe(dados);
}

// Só apaga arquivo dentro da pasta de fotos: o caminho vem do JSON do repositório.
async function apagarFotos(cliente, caminhos, motivo, avisos, mensagemAviso) {
  for (const caminho of caminhos) {
    if (!caminho || !imagemValida(caminho, PASTA_FOTOS)) continue;
    try {
      await cliente.apagarArquivo(caminho, motivo);
    } catch {
      avisos.push(mensagemAviso);
    }
  }
}

// Cria (id = null) ou edita um integrante. Ordem: valida, envia a foto, grava o JSON, apaga a foto antiga.
// A foto nova ganha um nome diferente a cada envio, para o navegador não mostrar a imagem velha em cache.
export async function salvarMembro({ cliente, dados, id = null, fotoBase64 = null, removerFoto = false, agora = Date.now }) {
  const erros = validarMembro(dados);
  if (erros.length > 0) throw new ErroValidacao(erros);

  const { dados: atual } = await cliente.lerJson(CAMINHO_EQUIPE);
  const lista = membrosDe(atual);
  const existente = id ? buscarMembro(lista, id) : null;
  if (id && !existente) throw new Error('Este integrante não existe mais.');
  const idFinal = id ?? gerarIdMembro(dados.nome, lista.map((membro) => membro.id));

  let foto = existente?.foto ?? null;
  if (removerFoto) foto = null;
  if (fotoBase64) {
    foto = `${PASTA_FOTOS}${idFinal}-${agora().toString(36)}.jpg`;
    await cliente.enviarArquivo(foto, fotoBase64, `Foto de ${dados.nome.trim()}`);
  }

  const registro = { ...dados, foto };
  await cliente.atualizarJson(
    CAMINHO_EQUIPE,
    (json) => {
      const base = membrosDe(json);
      return { ...json, membros: existente ? atualizarMembro(base, idFinal, registro) : adicionarMembro(base, registro, idFinal) };
    },
    `${existente ? 'Edita' : 'Adiciona'} integrante da equipe: ${dados.nome.trim()}`,
  );

  const avisos = [];
  const fotoAntiga = existente?.foto;
  if (fotoAntiga && fotoAntiga !== foto) {
    await apagarFotos(cliente, [fotoAntiga], `Remove foto antiga de ${idFinal}`, avisos, 'O integrante foi salvo, mas não foi possível apagar a foto antiga.');
  }
  return { id: idFinal, avisos };
}

export async function excluirMembroPublicado({ cliente, id }) {
  const { dados: atual } = await cliente.lerJson(CAMINHO_EQUIPE);
  const existente = buscarMembro(membrosDe(atual), id);
  if (!existente) throw new Error('Este integrante não existe mais.');

  await cliente.atualizarJson(
    CAMINHO_EQUIPE,
    (json) => ({ ...json, membros: removerMembro(membrosDe(json), id) }),
    `Remove integrante da equipe: ${existente.nome}`,
  );

  const avisos = [];
  await apagarFotos(cliente, [existente.foto], `Remove foto de ${id}`, avisos, 'O integrante foi excluído, mas não foi possível apagar a foto.');
  return { avisos };
}

export async function moverMembroPublicado({ cliente, id, delta }) {
  await cliente.atualizarJson(
    CAMINHO_EQUIPE,
    (json) => ({ ...json, membros: moverMembro(membrosDe(json), id, delta) }),
    'Reordena a equipe',
  );
}
