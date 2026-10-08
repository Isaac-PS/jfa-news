import { carregarJson } from './lib/dados.js';
import { criarClienteGitHub, ErroGitHub } from './lib/github.js';
import { ordenar, buscar, LIMITE_RESUMO } from './lib/modelo.js';
import { publicarNoticia, excluirNoticiaPublicada, ErroValidacao, CAMINHO_JSON, PASTA_IMAGENS } from './lib/publicar.js';
import { prepararImagem, validarArquivoImagem } from './lib/imagem.js';
import { formatarData, dataIsoLocal, imagemValida } from './lib/formato.js';
import { el, montar } from './lib/dom.js';
import { iniciarEquipeAdmin } from './admin-equipe.js';
import { envolver, prefixarLinha, inserirBloco, montarLink } from './lib/editor.js';
import { renderizarTexto } from './lib/render-texto.js';
import { linkSeguro, imagemSegura, videoIncorporado } from './lib/texto.js';

const CHAVE_TOKEN = 'fa-news-token';
const AVISO_PUBLICACAO = 'O site será atualizado em cerca de 1 a 2 minutos.';

const $ = (id) => document.getElementById(id);
const telas = { login: $('tela-login'), lista: $('tela-lista'), form: $('tela-form'), equipe: $('tela-equipe'), 'form-equipe': $('tela-form-equipe') };
const ABA_DA_TELA = { lista: 'lista', form: 'lista', equipe: 'equipe', 'form-equipe': 'equipe' };

let config = null;
let cliente = null;
let lista = [];
let editandoId = null;
let imagemPreparada = null; // { base64, previaUrl } da imagem escolhida no formulário
let geracaoImagem = 0; // muda a cada escolha de imagem: descarta resultado de preparo que ficou velho
let preparandoImagem = false; // true enquanto a imagem escolhida está sendo reduzida
let publicando = false; // true enquanto o envio ao GitHub está em andamento
let retomarTela = null; // após token recusado ao salvar, o próximo login volta ao formulário que estava aberto
let equipeAdmin = null;
let enviandoImagemTexto = false; // true enquanto uma imagem do texto sobe para o GitHub
const previasLocais = new Map(); // caminho no site → prévia das imagens enviadas nesta sessão (o site leva 1-2 min para servi-las)

// ===== Token =====
function lerToken() {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN) ?? localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

function guardarToken(token, lembrar) {
  apagarToken(); // um token velho no outro armazenamento venceria o novo em lerToken()
  try {
    (lembrar ? localStorage : sessionStorage).setItem(CHAVE_TOKEN, token);
  } catch {
    // Armazenamento indisponível: o token vale só enquanto esta página estiver aberta.
  }
}

function apagarToken() {
  try {
    sessionStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // Nada a apagar se o armazenamento está indisponível.
  }
}

// ===== Telas e mensagens =====
function mostrarTela(nome) {
  for (const [chave, secao] of Object.entries(telas)) secao.hidden = chave !== nome;
  $('botao-sair').hidden = nome === 'login';
  $('abas').hidden = nome === 'login';
  for (const botao of document.querySelectorAll('[data-aba]')) {
    if (botao.dataset.aba === ABA_DA_TELA[nome]) botao.setAttribute('aria-current', 'page');
    else botao.removeAttribute('aria-current');
  }
}

function mostrarMensagem(tipo, texto) {
  montar($('mensagem'), el('div', { class: `mensagem mensagem--${tipo}`, text: texto }));
  $('mensagem').scrollIntoView({ block: 'nearest' });
}

function limparMensagem() {
  montar($('mensagem'));
}

function textoDoErro(erro) {
  if (erro instanceof ErroValidacao) return erro.erros.join(' ');
  if (erro instanceof ErroGitHub && erro.tipo === 'conflito') {
    return 'Não foi possível salvar porque outra pessoa alterou as notícias ao mesmo tempo. Tente de novo.';
  }
  return erro?.message || 'Algo deu errado. Tente de novo.';
}

function tratarErro(erro, complemento = '') {
  console.error(erro);
  if (erro instanceof ErroGitHub && erro.tipo === 'token') {
    apagarToken();
    cliente = null;
    mostrarTela('login');
  }
  mostrarMensagem('erro', [textoDoErro(erro), complemento].filter(Boolean).join(' '));
}

// ===== Lista =====
async function recarregarLista() {
  const { dados } = await cliente.lerJson(CAMINHO_JSON);
  lista = dados.noticias;
  desenharLista();
}

function desenharLista() {
  const itens = ordenar(lista);
  montar($('lista-admin'),
    itens.length === 0
      ? el('li', { class: 'aviso', text: 'Nenhuma notícia publicada ainda.' })
      : itens.map((noticia) => el('li', { class: 'item-admin' },
          el('div', {},
            el('div', { class: 'item-admin__titulo', text: noticia.titulo }),
            el('div', { class: 'item-admin__data', text: formatarData(noticia.data) }),
          ),
          el('div', { class: 'item-admin__acoes' },
            el('button', { type: 'button', class: 'botao botao--contorno botao--pequeno', text: 'Editar', onclick: () => abrirFormulario(noticia.id) }),
            el('button', { type: 'button', class: 'botao botao--perigo botao--pequeno', text: 'Excluir', onclick: () => excluir(noticia) }),
          ),
        )),
  );
}

async function excluir(noticia) {
  if (!window.confirm(`Excluir a notícia "${noticia.titulo}"? Esta ação não pode ser desfeita.`)) return;
  limparMensagem();
  let avisos;
  try {
    ({ avisos } = await excluirNoticiaPublicada({ cliente, id: noticia.id }));
  } catch (erro) {
    tratarErro(erro);
    return;
  }
  // A notícia já foi excluída: uma falha só na recarga não pode deixá-la na tela.
  try {
    await recarregarLista();
    mostrarMensagem(avisos.length > 0 ? 'info' : 'ok', ['Notícia excluída.', AVISO_PUBLICACAO, ...avisos].join(' '));
  } catch (erro) {
    console.error(erro);
    lista = lista.filter((n) => n.id !== noticia.id);
    desenharLista();
    mostrarMensagem('info', ['Notícia excluída.', 'Não foi possível atualizar a lista agora. Recarregue a página para vê-la.', ...avisos].join(' '));
  }
}

// ===== Formulário =====
function atualizarContador() {
  const tamanho = $('campo-resumo').value.length;
  $('contador-resumo').textContent = `${tamanho}/${LIMITE_RESUMO}`;
  $('contador-resumo').classList.toggle('excedeu', tamanho > LIMITE_RESUMO);
}

function atualizarBotaoPublicar() {
  $('botao-publicar').disabled = publicando || preparandoImagem;
}

function atualizarPrevia(src) {
  const imagem = $('previa-imagem');
  if (src) {
    imagem.src = src;
    imagem.hidden = false;
  } else {
    imagem.removeAttribute('src');
    imagem.hidden = true;
  }
}

function abrirFormulario(id = null) {
  limparMensagem();
  editandoId = id;
  imagemPreparada = null;
  geracaoImagem += 1; // descarta qualquer preparo de imagem que ainda esteja em andamento
  preparandoImagem = false;
  atualizarBotaoPublicar();
  const noticia = id ? buscar(lista, id) : null;
  $('titulo-formulario').textContent = noticia ? 'Editar notícia' : 'Nova notícia';
  $('campo-titulo').value = noticia?.titulo ?? '';
  $('campo-autor').value = noticia?.autor ?? 'Equipe FA News';
  $('campo-data').value = noticia?.data ?? dataIsoLocal();
  $('campo-resumo').value = noticia?.resumo ?? '';
  $('campo-texto').value = noticia?.texto ?? '';
  $('campo-imagem').value = '';
  $('campo-remover-imagem').checked = false;
  $('grupo-remover-imagem').hidden = !noticia?.imagem;
  atualizarContador();
  atualizarPreviaTexto();
  atualizarPrevia(imagemValida(noticia?.imagem) ? `../${noticia.imagem}` : null);
  mostrarTela('form');
  $('campo-titulo').focus();
}

// ===== Editor do texto =====
function atualizarPreviaTexto() {
  montar($('previa-texto'), renderizarTexto($('campo-texto').value, (caminho) => previasLocais.get(caminho) ?? `../${caminho}`));
}

function aplicarNoTexto(resultado) {
  const campo = $('campo-texto');
  campo.value = resultado.valor;
  campo.focus();
  campo.setSelectionRange(resultado.inicio, resultado.fim);
  atualizarPreviaTexto();
}

// Aceita "exemplo.com" (sem https://) e protege os parênteses, que quebrariam a marcação [texto](endereço).
function normalizarEndereco(bruto) {
  const endereco = bruto.trim();
  if (!endereco || /\s/.test(endereco)) return null;
  const completo = /^[a-z][a-z0-9+.-]*:/i.test(endereco) ? endereco : `https://${endereco}`;
  return completo.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function abrirDialogo(nome) {
  const dialogo = $(`dialogo-${nome}`);
  dialogo.querySelector('form').reset();
  $(`erro-${nome}`).hidden = true;
  dialogo.showModal();
  dialogo.querySelector('input').focus();
}

function erroNoDialogo(nome, texto) {
  const erro = $(`erro-${nome}`);
  erro.textContent = texto;
  erro.hidden = false;
}

function aoClicarBarra(evento) {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const { value, selectionStart: inicio, selectionEnd: fim } = $('campo-texto');
  switch (botao.dataset.acao) {
    case 'subtitulo': aplicarNoTexto(prefixarLinha(value, inicio, fim, '## ')); break;
    case 'negrito': aplicarNoTexto(envolver(value, inicio, fim, '**', 'texto em negrito')); break;
    case 'italico': aplicarNoTexto(envolver(value, inicio, fim, '*', 'texto em itálico')); break;
    default: abrirDialogo(botao.dataset.acao);
  }
}

function aoEnviarLink(evento) {
  evento.preventDefault();
  const endereco = normalizarEndereco($('campo-link-url').value);
  if (!endereco || !linkSeguro(endereco)) {
    erroNoDialogo('link', 'Informe um endereço válido, como https://exemplo.com.');
    return;
  }
  const campo = $('campo-texto');
  $('dialogo-link').close();
  aplicarNoTexto(montarLink(campo.value, campo.selectionStart, campo.selectionEnd, endereco));
}

function aoEnviarVideo(evento) {
  evento.preventDefault();
  const endereco = normalizarEndereco($('campo-video-url').value);
  if (!endereco || !videoIncorporado(endereco)) {
    erroNoDialogo('video', 'Use um link de vídeo do YouTube ou do Vimeo.');
    return;
  }
  const campo = $('campo-texto');
  $('dialogo-video').close();
  aplicarNoTexto(inserirBloco(campo.value, campo.selectionStart, campo.selectionEnd, endereco));
}

async function aoEnviarImagemTexto(evento) {
  evento.preventDefault();
  if (enviandoImagemTexto) return;
  const arquivo = $('campo-corpo-arquivo').files[0];
  const endereco = normalizarEndereco($('campo-corpo-url').value);
  const descricao = $('campo-corpo-descricao').value.replace(/[[\]\s]+/g, ' ').trim();

  let src = null;
  if (arquivo) {
    const problema = validarArquivoImagem(arquivo);
    if (problema) {
      erroNoDialogo('imagem', problema);
      return;
    }
  } else if (endereco && imagemSegura(endereco)?.startsWith('https:')) {
    src = endereco;
  } else {
    erroNoDialogo('imagem', endereco ? 'O endereço da imagem precisa começar com https://.' : 'Escolha uma imagem ou informe o endereço de uma.');
    return;
  }

  if (arquivo) {
    const botao = $('botao-inserir-imagem');
    enviandoImagemTexto = true;
    botao.disabled = true;
    botao.textContent = 'Enviando…';
    try {
      const { base64, previaUrl } = await prepararImagem(arquivo);
      const caminho = `${PASTA_IMAGENS}corpo-${Date.now()}.jpg`;
      await cliente.enviarArquivo(caminho, base64, 'Imagem dentro de uma notícia');
      previasLocais.set(caminho, previaUrl);
      src = caminho;
    } catch (erro) {
      console.error(erro);
      if (erro instanceof ErroGitHub && erro.tipo === 'token') {
        $('dialogo-imagem').close();
        retomarTela = 'form';
        tratarErro(erro, 'O que você estava escrevendo foi mantido: entre de novo com um token com permissão de escrita.');
      } else {
        erroNoDialogo('imagem', erro instanceof ErroGitHub ? textoDoErro(erro) : 'Não foi possível enviar esta imagem. Tente de novo.');
      }
      return;
    } finally {
      enviandoImagemTexto = false;
      botao.disabled = false;
      botao.textContent = 'Inserir';
    }
  }

  const campo = $('campo-texto');
  $('dialogo-imagem').close();
  aplicarNoTexto(inserirBloco(campo.value, campo.selectionStart, campo.selectionEnd, `![${descricao}](${src})`));
}

function iniciarEditorTexto() {
  $('campo-texto').addEventListener('input', atualizarPreviaTexto);
  document.querySelector('.barra-editor').addEventListener('click', aoClicarBarra);
  $('form-link').addEventListener('submit', aoEnviarLink);
  $('form-imagem').addEventListener('submit', aoEnviarImagemTexto);
  $('form-video').addEventListener('submit', aoEnviarVideo);
  for (const botao of document.querySelectorAll('[data-fechar]')) {
    botao.addEventListener('click', () => botao.closest('dialog').close());
  }
  // Durante o envio da imagem, Esc não pode fechar a janela: o resultado precisa de onde aparecer.
  $('dialogo-imagem').addEventListener('cancel', (evento) => {
    if (enviandoImagemTexto) evento.preventDefault();
  });
}

async function aoEscolherImagem(evento) {
  const geracao = ++geracaoImagem;
  preparandoImagem = false;
  atualizarBotaoPublicar();
  const arquivo = evento.target.files[0];
  imagemPreparada = null;
  if (!arquivo) {
    atualizarPrevia(null);
    return;
  }
  const problema = validarArquivoImagem(arquivo);
  if (problema) {
    evento.target.value = '';
    atualizarPrevia(null);
    mostrarMensagem('erro', problema);
    return;
  }
  // Até a imagem ficar pronta, Publicar fica desabilitado: senão a notícia sairia sem a imagem.
  preparandoImagem = true;
  atualizarBotaoPublicar();
  try {
    const preparada = await prepararImagem(arquivo);
    if (geracao !== geracaoImagem) return; // outra imagem foi escolhida (ou o formulário foi reaberto) depois desta
    imagemPreparada = preparada;
    atualizarPrevia(preparada.previaUrl);
    $('campo-remover-imagem').checked = false;
    limparMensagem();
  } catch (erro) {
    if (geracao !== geracaoImagem) return;
    console.error(erro);
    evento.target.value = '';
    atualizarPrevia(null);
    mostrarMensagem('erro', 'Não foi possível ler esta imagem. Tente outro arquivo.');
  } finally {
    if (geracao === geracaoImagem) {
      preparandoImagem = false;
      atualizarBotaoPublicar();
    }
  }
}

async function aoEnviarFormulario(evento) {
  evento.preventDefault();
  if (publicando || preparandoImagem) return;
  limparMensagem();
  const botao = $('botao-publicar');
  publicando = true;
  atualizarBotaoPublicar();
  botao.textContent = 'Publicando…';
  try {
    const dados = {
      titulo: $('campo-titulo').value,
      autor: $('campo-autor').value,
      data: $('campo-data').value,
      resumo: $('campo-resumo').value,
      texto: $('campo-texto').value,
    };
    const { avisos } = await publicarNoticia({
      cliente,
      dados,
      id: editandoId,
      imagemBase64: imagemPreparada?.base64 ?? null,
      removerImagem: $('campo-remover-imagem').checked,
    });
    // A notícia já está publicada: a partir daqui, repetir o envio criaria uma duplicata.
    editandoId = null;
    imagemPreparada = null;
    let listaAtualizada = true;
    try {
      await recarregarLista();
    } catch (erroRecarga) {
      console.error(erroRecarga);
      listaAtualizada = false;
    }
    mostrarTela('lista');
    if (listaAtualizada) {
      mostrarMensagem(avisos.length > 0 ? 'info' : 'ok', ['Publicado!', AVISO_PUBLICACAO, ...avisos].join(' '));
    } else {
      mostrarMensagem('info', ['Publicado!', 'Não foi possível atualizar a lista agora. Recarregue a página para vê-la.', ...avisos].join(' '));
    }
  } catch (erro) {
    if (erro instanceof ErroGitHub && erro.tipo === 'token') {
      // Token sem permissão de escrita: o formulário não é tocado, e o próximo login volta a ele.
      retomarTela = 'form';
      tratarErro(erro, 'O que você estava escrevendo foi mantido: entre de novo com um token com permissão de escrita para publicar.');
    } else {
      tratarErro(erro);
    }
  } finally {
    publicando = false;
    atualizarBotaoPublicar();
    botao.textContent = 'Publicar';
  }
}

// ===== Login =====
async function entrar(token) {
  const novo = criarClienteGitHub({ ...config.github, token });
  await novo.validarAcesso();
  cliente = novo;
  await recarregarLista();
  mostrarTela(retomarTela ?? 'lista');
  retomarTela = null;
}

async function aoEnviarLogin(evento) {
  evento.preventDefault();
  limparMensagem();
  const token = $('campo-token').value.trim();
  if (!token) {
    mostrarMensagem('erro', 'Cole o token de acesso.');
    return;
  }
  const botao = $('botao-entrar');
  botao.disabled = true;
  try {
    await entrar(token);
    guardarToken(token, $('campo-lembrar').checked);
    $('campo-token').value = '';
  } catch (erro) {
    tratarErro(erro);
  } finally {
    botao.disabled = false;
  }
}

function sair() {
  apagarToken();
  cliente = null;
  lista = [];
  retomarTela = null; // logout explícito: o rascunho não volta (abrirFormulario limpa tudo)
  limparMensagem();
  mostrarTela('login');
}

// ===== Início =====
async function iniciar() {
  $('form-login').addEventListener('submit', aoEnviarLogin);
  $('form-noticia').addEventListener('submit', aoEnviarFormulario);
  $('campo-resumo').addEventListener('input', atualizarContador);
  iniciarEditorTexto();
  $('campo-imagem').addEventListener('change', aoEscolherImagem);
  $('botao-nova').addEventListener('click', () => abrirFormulario());
  $('botao-cancelar').addEventListener('click', () => {
    limparMensagem();
    mostrarTela('lista');
  });
  $('botao-sair').addEventListener('click', sair);
  equipeAdmin = iniciarEquipeAdmin({
    cliente: () => cliente,
    mostrarTela,
    mostrarMensagem,
    limparMensagem,
    tratarErro,
    retomarNaTela: (nome) => { retomarTela = nome; },
  });
  $('abas').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-aba]');
    if (!botao) return;
    if (botao.dataset.aba === 'equipe') equipeAdmin.abrirLista();
    else {
      limparMensagem();
      mostrarTela('lista');
    }
  });
  mostrarTela('login');

  try {
    config = await carregarJson('../data/config.json');
  } catch (erro) {
    console.error(erro);
    mostrarMensagem('erro', 'Não foi possível ler o arquivo data/config.json.');
    return;
  }
  if (config.github.owner === 'SEU-USUARIO') {
    mostrarMensagem('info', 'Antes de usar o painel, informe o seu repositório do GitHub em data/config.json.');
  }

  const guardado = lerToken();
  if (guardado) {
    try {
      await entrar(guardado);
    } catch (erro) {
      tratarErro(erro);
    }
  }
}

iniciar();
