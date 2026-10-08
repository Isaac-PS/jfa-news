import { carregarJson } from './lib/dados.js';
import { el, montar } from './lib/dom.js';
import { iniciais, imagemValida, linkWhatsapp, usuarioInstagram } from './lib/formato.js';

function iniciarMenu() {
  const botao = document.querySelector('.menu__botao');
  const lista = document.getElementById('menu-lista');
  if (!botao || !lista) return;
  const alternar = (aberto) => {
    lista.classList.toggle('aberto', aberto);
    botao.setAttribute('aria-expanded', String(aberto));
  };
  botao.addEventListener('click', () => alternar(!lista.classList.contains('aberto')));
  lista.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) alternar(false);
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && lista.classList.contains('aberto')) {
      alternar(false);
      botao.focus();
    }
  });
}

// Revela seções e listas quando entram na tela. As classes só são colocadas aqui:
// sem JavaScript, com movimento reduzido ou sem IntersectionObserver, nada fica escondido.
function iniciarRevelar() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const alvos = document.querySelectorAll('.secao__cabeca, .faixa__interno, .patrocinio__interno, .grade-cards, .grade-equipe, .redes');
  const observador = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      entrada.target.classList.add('visivel');
      observador.unobserve(entrada.target);
    }
  }, { threshold: 0.12 });
  for (const alvo of alvos) {
    alvo.classList.add(alvo.matches('.grade-cards, .grade-equipe, .redes') ? 'cascata' : 'revelar');
    observador.observe(alvo);
  }
}

function aplicarConfig(config) {
  const links = {
    youtube: config.youtube,
    instagram: config.instagram,
    whatsapp: linkWhatsapp(config.whatsapp, config.mensagemPatrocinio),
    email: `mailto:${config.email}`,
  };
  for (const no of document.querySelectorAll('[data-link]')) {
    const url = links[no.dataset.link];
    if (url) no.setAttribute('href', url);
  }

  const usuario = usuarioInstagram(config.instagram);
  const textos = {
    whatsappExibicao: config.whatsappExibicao,
    email: config.email,
    instagramExibicao: usuario ? `@${usuario}` : '',
  };
  for (const no of document.querySelectorAll('[data-texto]')) {
    const texto = textos[no.dataset.texto];
    if (texto) no.textContent = texto;
  }
}

function criarMembro(membro) {
  const iniciaisNo = () => el('div', { class: 'membro__iniciais', 'aria-hidden': 'true', text: iniciais(membro.nome) });
  const foto = imagemValida(membro.foto, 'assets/equipe/')
    ? el('img', { class: 'membro__foto', src: membro.foto, alt: `Foto de ${membro.nome}`, loading: 'lazy' })
    : iniciaisNo();
  // Foto citada no JSON mas ainda não publicada: mostra as iniciais em vez da imagem quebrada.
  if (foto.tagName === 'IMG') foto.addEventListener('error', () => foto.replaceWith(iniciaisNo()), { once: true });
  return el('article', { class: 'membro' },
    foto,
    el('h3', { text: membro.nome }),
    el('p', { class: 'membro__funcao', text: membro.funcao }),
    membro.bio ? el('p', { class: 'membro__bio', text: membro.bio }) : null,
  );
}

async function iniciarEquipe(container) {
  try {
    const dados = await carregarJson('data/equipe.json');
    const membros = Array.isArray(dados.membros) ? dados.membros : [];
    if (membros.length === 0) {
      montar(container, el('p', { class: 'aviso', text: 'A equipe será apresentada em breve.' }));
      return;
    }
    montar(container, membros.map(criarMembro));
  } catch (erro) {
    console.error(erro);
    montar(container, el('p', { class: 'aviso aviso--erro', text: 'Não foi possível carregar a equipe agora.' }));
  }
}

iniciarMenu();
iniciarRevelar();

carregarJson('data/config.json')
  .then(aplicarConfig)
  .catch((erro) => console.error('Não foi possível ler data/config.json', erro));

const containerEquipe = document.getElementById('equipe-lista');
if (containerEquipe) iniciarEquipe(containerEquipe);
