import { carregarJson } from './lib/dados.js';
import { criarClienteGitHub, ErroGitHub } from './lib/github.js';
import { ordenar, buscar, LIMITE_RESUMO } from './lib/modelo.js';
import { publicarNoticia, excluirNoticiaPublicada, ErroValidacao, CAMINHO_JSON } from './lib/publicar.js';
import { prepararImagem, validarArquivoImagem } from './lib/imagem.js';
import { formatarData, dataIsoLocal } from './lib/formato.js';
import { el, montar } from './lib/dom.js';

const CHAVE_TOKEN = 'fa-news-token';
const AVISO_PUBLICACAO = 'O site será atualizado em cerca de 1 a 2 minutos.';

const $ = (id) => document.getElementById(id);
const telas = { login: $('tela-login'), lista: $('tela-lista'), form: $('tela-form') };

let config = null;
let cliente = null;
let lista = [];
let editandoId = null;
let imagemPreparada = null; // { base64, previaUrl } da imagem escolhida no formulário

// ===== Token =====
function lerToken() {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN) ?? localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

function guardarToken(token, lembrar) {
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

function tratarErro(erro) {
  console.error(erro);
  if (erro instanceof ErroGitHub && erro.tipo === 'token') {
    apagarToken();
    cliente = null;
    mostrarTela('login');
  }
  mostrarMensagem('erro', textoDoErro(erro));
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
  try {
    const { avisos } = await excluirNoticiaPublicada({ cliente, id: noticia.id });
    await recarregarLista();
    mostrarMensagem(avisos.length > 0 ? 'info' : 'ok', ['Notícia excluída.', AVISO_PUBLICACAO, ...avisos].join(' '));
  } catch (erro) {
    tratarErro(erro);
  }
}

// ===== Formulário =====
function atualizarContador() {
  const tamanho = $('campo-resumo').value.length;
  $('contador-resumo').textContent = `${tamanho}/${LIMITE_RESUMO}`;
  $('contador-resumo').classList.toggle('excedeu', tamanho > LIMITE_RESUMO);
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
  atualizarPrevia(noticia?.imagem ? `../${noticia.imagem}` : null);
  mostrarTela('form');
  $('campo-titulo').focus();
}

async function aoEscolherImagem(evento) {
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
  try {
    imagemPreparada = await prepararImagem(arquivo);
    atualizarPrevia(imagemPreparada.previaUrl);
    $('campo-remover-imagem').checked = false;
    limparMensagem();
  } catch (erro) {
    console.error(erro);
    evento.target.value = '';
    atualizarPrevia(null);
    mostrarMensagem('erro', 'Não foi possível ler esta imagem. Tente outro arquivo.');
  }
}

async function aoEnviarFormulario(evento) {
  evento.preventDefault();
  limparMensagem();
  const botao = $('botao-publicar');
  botao.disabled = true;
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
    await recarregarLista();
    mostrarTela('lista');
    mostrarMensagem(avisos.length > 0 ? 'info' : 'ok', ['Publicado!', AVISO_PUBLICACAO, ...avisos].join(' '));
  } catch (erro) {
    tratarErro(erro);
  } finally {
    botao.disabled = false;
    botao.textContent = 'Publicar';
  }
}

// ===== Login =====
async function entrar(token) {
  const novo = criarClienteGitHub({ ...config.github, token });
  await novo.validarAcesso();
  cliente = novo;
  await recarregarLista();
  mostrarTela('lista');
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
  limparMensagem();
  mostrarTela('login');
}

// ===== Início =====
async function iniciar() {
  $('form-login').addEventListener('submit', aoEnviarLogin);
  $('form-noticia').addEventListener('submit', aoEnviarFormulario);
  $('campo-resumo').addEventListener('input', atualizarContador);
  $('campo-imagem').addEventListener('change', aoEscolherImagem);
  $('botao-nova').addEventListener('click', () => abrirFormulario());
  $('botao-cancelar').addEventListener('click', () => {
    limparMensagem();
    mostrarTela('lista');
  });
  $('botao-sair').addEventListener('click', sair);
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
