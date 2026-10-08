// Painel da equipe: lista, adiciona, edita, reordena e exclui integrantes (data/equipe.json) e suas fotos.
import { el, montar } from './lib/dom.js';
import { ErroGitHub } from './lib/github.js';
import { lerEquipe, salvarMembro, excluirMembroPublicado, moverMembroPublicado, PASTA_FOTOS } from './lib/publicar-equipe.js';
import { buscarMembro, LIMITE_BIO } from './lib/equipe.js';
import { validarArquivoImagem } from './lib/imagem.js';
import { recortarFoto } from './lib/foto.js';
import { iniciais, imagemValida } from './lib/formato.js';

const AVISO_PUBLICACAO = 'O site será atualizado em cerca de 1 a 2 minutos.';
const POSICAO_PADRAO_VERTICAL = 0.25; // fotos de retrato costumam ter o rosto no terço de cima

const $ = (id) => document.getElementById(id);

// `ctx` vem do admin.js: { cliente(), mostrarTela, mostrarMensagem, limparMensagem, tratarErro, retomarNaTela }
export function iniciarEquipeAdmin(ctx) {
  let lista = [];
  let editandoId = null;
  let imagemFoto = null; // ImageBitmap da foto escolhida
  let fotoPreparada = null; // { base64, previaUrl } do recorte atual
  let geracaoFoto = 0; // descarta a leitura de uma foto que ficou velha
  let lendoFoto = false;
  let salvando = false;
  let ocupado = false; // true enquanto mover/excluir está em andamento

  function liberarImagem() {
    imagemFoto?.close?.();
    imagemFoto = null;
    fotoPreparada = null;
  }

  // ===== Lista =====
  async function recarregar() {
    lista = await lerEquipe(ctx.cliente());
    desenharLista();
  }

  function avatar(membro) {
    const iniciaisNo = () => el('div', { class: 'item-admin__foto item-admin__foto--iniciais', 'aria-hidden': 'true', text: iniciais(membro.nome) });
    if (!imagemValida(membro.foto, PASTA_FOTOS)) return iniciaisNo();
    const foto = el('img', { class: 'item-admin__foto', src: `../${membro.foto}`, alt: '' });
    foto.addEventListener('error', () => foto.replaceWith(iniciaisNo()), { once: true }); // foto ainda não publicada
    return foto;
  }

  function desenharLista() {
    montar($('lista-equipe'),
      lista.length === 0
        ? el('li', { class: 'aviso', text: 'Nenhum integrante cadastrado ainda.' })
        : lista.map((membro, indice) => el('li', { class: 'item-admin' },
            el('div', { class: 'item-admin__pessoa' },
              avatar(membro),
              el('div', {},
                el('div', { class: 'item-admin__titulo', text: membro.nome }),
                el('div', { class: 'item-admin__data', text: membro.funcao }),
              ),
            ),
            el('div', { class: 'item-admin__acoes' },
              el('button', { type: 'button', class: 'botao botao--contorno botao--pequeno botao--seta', 'aria-label': `Subir ${membro.nome}`, title: 'Subir', text: '↑', disabled: indice === 0, onclick: () => mover(membro, -1) }),
              el('button', { type: 'button', class: 'botao botao--contorno botao--pequeno botao--seta', 'aria-label': `Descer ${membro.nome}`, title: 'Descer', text: '↓', disabled: indice === lista.length - 1, onclick: () => mover(membro, 1) }),
              el('button', { type: 'button', class: 'botao botao--contorno botao--pequeno', text: 'Editar', onclick: () => abrirFormulario(membro.id) }),
              el('button', { type: 'button', class: 'botao botao--perigo botao--pequeno', text: 'Excluir', onclick: () => excluir(membro) }),
            ),
          )),
    );
  }

  async function abrirLista() {
    ctx.limparMensagem();
    ctx.mostrarTela('equipe');
    try {
      await recarregar();
    } catch (erro) {
      ctx.tratarErro(erro);
    }
  }

  async function mover(membro, delta) {
    if (ocupado) return;
    ocupado = true;
    ctx.limparMensagem();
    try {
      await moverMembroPublicado({ cliente: ctx.cliente(), id: membro.id, delta });
      await recarregar();
      ctx.mostrarMensagem('ok', `Ordem atualizada. ${AVISO_PUBLICACAO}`);
    } catch (erro) {
      ctx.tratarErro(erro);
    } finally {
      ocupado = false;
    }
  }

  async function excluir(membro) {
    if (ocupado) return;
    if (!window.confirm(`Excluir ${membro.nome} da equipe? Esta ação não pode ser desfeita.`)) return;
    ocupado = true;
    ctx.limparMensagem();
    try {
      let avisos;
      try {
        ({ avisos } = await excluirMembroPublicado({ cliente: ctx.cliente(), id: membro.id }));
      } catch (erro) {
        ctx.tratarErro(erro);
        return;
      }
      try {
        await recarregar();
        ctx.mostrarMensagem(avisos.length > 0 ? 'info' : 'ok', ['Integrante excluído.', AVISO_PUBLICACAO, ...avisos].join(' '));
      } catch (erro) {
        console.error(erro);
        lista = lista.filter((m) => m.id !== membro.id);
        desenharLista();
        ctx.mostrarMensagem('info', ['Integrante excluído.', 'Não foi possível atualizar a lista agora. Recarregue a página para vê-la.', ...avisos].join(' '));
      }
    } finally {
      ocupado = false;
    }
  }

  // ===== Formulário =====
  function atualizarContador() {
    const tamanho = $('campo-membro-bio').value.length;
    $('contador-bio').textContent = `${tamanho}/${LIMITE_BIO}`;
    $('contador-bio').classList.toggle('excedeu', tamanho > LIMITE_BIO);
  }

  function atualizarBotao() {
    $('botao-salvar-membro').disabled = salvando || lendoFoto;
  }

  function mostrarPrevia(src) {
    const imagem = $('previa-foto-membro');
    if (src) {
      imagem.src = src;
      imagem.hidden = false;
    } else {
      imagem.removeAttribute('src');
      imagem.hidden = true;
    }
  }

  function abrirFormulario(id = null) {
    ctx.limparMensagem();
    editandoId = id;
    liberarImagem();
    geracaoFoto += 1;
    lendoFoto = false;
    atualizarBotao();
    const membro = id ? buscarMembro(lista, id) : null;
    $('titulo-form-equipe').textContent = membro ? 'Editar integrante' : 'Novo integrante';
    $('campo-membro-nome').value = membro?.nome ?? '';
    $('campo-membro-funcao').value = membro?.funcao ?? '';
    $('campo-membro-bio').value = membro?.bio ?? '';
    $('campo-membro-foto').value = '';
    $('campo-remover-foto').checked = false;
    $('grupo-remover-foto').hidden = !membro?.foto;
    $('grupo-enquadramento').hidden = true;
    atualizarContador();
    mostrarPrevia(imagemValida(membro?.foto, PASTA_FOTOS) ? `../${membro.foto}` : null);
    ctx.mostrarTela('form-equipe');
    $('campo-membro-nome').focus();
  }

  function aplicarRecorte() {
    fotoPreparada = recortarFoto(imagemFoto, Number($('campo-enquadramento').value) / 100);
    mostrarPrevia(fotoPreparada.previaUrl);
  }

  async function aoEscolherFoto(evento) {
    const geracao = ++geracaoFoto;
    lendoFoto = false;
    atualizarBotao();
    liberarImagem();
    $('grupo-enquadramento').hidden = true;
    const arquivo = evento.target.files[0];
    if (!arquivo) {
      mostrarPrevia(null);
      return;
    }
    const problema = validarArquivoImagem(arquivo);
    if (problema) {
      evento.target.value = '';
      mostrarPrevia(null);
      ctx.mostrarMensagem('erro', problema);
      return;
    }
    lendoFoto = true;
    atualizarBotao();
    try {
      const imagem = await createImageBitmap(arquivo);
      if (geracao !== geracaoFoto) {
        imagem.close?.();
        return;
      }
      imagemFoto = imagem;
      const semFolga = imagem.width === imagem.height;
      $('campo-enquadramento').value = String(Math.round((imagem.height > imagem.width ? POSICAO_PADRAO_VERTICAL : 0.5) * 100));
      $('grupo-enquadramento').hidden = semFolga;
      $('campo-remover-foto').checked = false;
      aplicarRecorte();
      ctx.limparMensagem();
    } catch (erro) {
      if (geracao !== geracaoFoto) return;
      console.error(erro);
      evento.target.value = '';
      mostrarPrevia(null);
      ctx.mostrarMensagem('erro', 'Não foi possível ler esta imagem. Tente outro arquivo.');
    } finally {
      if (geracao === geracaoFoto) {
        lendoFoto = false;
        atualizarBotao();
      }
    }
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    if (salvando || lendoFoto) return;
    ctx.limparMensagem();
    const botao = $('botao-salvar-membro');
    salvando = true;
    atualizarBotao();
    botao.textContent = 'Salvando…';
    try {
      const { avisos } = await salvarMembro({
        cliente: ctx.cliente(),
        dados: {
          nome: $('campo-membro-nome').value,
          funcao: $('campo-membro-funcao').value,
          bio: $('campo-membro-bio').value,
        },
        id: editandoId,
        fotoBase64: fotoPreparada?.base64 ?? null,
        removerFoto: $('campo-remover-foto').checked,
      });
      // Já foi salvo: repetir o envio criaria um integrante repetido.
      editandoId = null;
      liberarImagem();
      let listaAtualizada = true;
      try {
        await recarregar();
      } catch (erroRecarga) {
        console.error(erroRecarga);
        listaAtualizada = false;
      }
      ctx.mostrarTela('equipe');
      ctx.mostrarMensagem(
        listaAtualizada && avisos.length === 0 ? 'ok' : 'info',
        ['Salvo!', listaAtualizada ? AVISO_PUBLICACAO : 'Não foi possível atualizar a lista agora. Recarregue a página para vê-la.', ...avisos].join(' '),
      );
    } catch (erro) {
      if (erro instanceof ErroGitHub && erro.tipo === 'token') {
        ctx.retomarNaTela('form-equipe');
        ctx.tratarErro(erro, 'O que você estava escrevendo foi mantido: entre de novo com um token com permissão de escrita para salvar.');
      } else {
        ctx.tratarErro(erro);
      }
    } finally {
      salvando = false;
      atualizarBotao();
      botao.textContent = 'Salvar';
    }
  }

  $('botao-novo-membro').addEventListener('click', () => abrirFormulario());
  $('botao-cancelar-membro').addEventListener('click', () => {
    ctx.limparMensagem();
    liberarImagem();
    ctx.mostrarTela('equipe');
  });
  $('form-equipe').addEventListener('submit', aoEnviar);
  $('campo-membro-bio').addEventListener('input', atualizarContador);
  $('campo-membro-foto').addEventListener('change', aoEscolherFoto);
  $('campo-enquadramento').addEventListener('input', () => {
    if (imagemFoto) aplicarRecorte();
  });

  return { abrirLista };
}
