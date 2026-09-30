import { carregarJson } from './lib/dados.js';
import { el, montar } from './lib/dom.js';
import { ordenar, buscar } from './lib/modelo.js';
import { formatarData, imagemValida, resumoOuInicio } from './lib/formato.js';
import { paragrafos } from './lib/texto.js';

const AVISO_VAZIO = 'Ainda não há notícias publicadas. Volte em breve!';
const AVISO_ERRO = 'Não foi possível carregar as notícias agora. Tente novamente em instantes.';
const TITULO_SITE = 'Jornal FA News';

const aviso = (texto, erro = false) => el('p', { class: erro ? 'aviso aviso--erro' : 'aviso', text: texto });

async function carregarNoticias() {
  const dados = await carregarJson('data/noticias.json');
  if (!dados || !Array.isArray(dados.noticias)) throw new Error('data/noticias.json com formato inválido');
  return ordenar(dados.noticias);
}

export function criarCard(noticia, nivelTitulo = 'h3') {
  const midia = imagemValida(noticia.imagem)
    ? el('img', { class: 'card__imagem', src: noticia.imagem, alt: `Imagem da notícia: ${noticia.titulo}`, loading: 'lazy' })
    : el('div', { class: 'card__imagem card__imagem--vazia' }, el('img', { src: 'assets/icone.png', alt: '', width: 72, height: 72 }));

  return el('article', { class: 'card' },
    midia,
    el('div', { class: 'card__corpo' },
      el('span', { class: 'card__data', text: formatarData(noticia.data) }),
      el(nivelTitulo, { class: 'card__titulo' },
        el('a', { href: `noticia.html?id=${encodeURIComponent(noticia.id)}`, text: noticia.titulo })),
      el('p', { class: 'card__resumo', text: resumoOuInicio(noticia) }),
      el('span', { class: 'card__mais', 'aria-hidden': 'true', text: 'Ler notícia →' }),
    ),
  );
}

async function iniciarLista(container, limite, nivelTitulo) {
  try {
    const noticias = (await carregarNoticias()).slice(0, limite);
    if (noticias.length === 0) {
      montar(container, aviso(AVISO_VAZIO));
      return;
    }
    montar(container, noticias.map((noticia) => criarCard(noticia, nivelTitulo)));
  } catch (erro) {
    console.error(erro);
    montar(container, aviso(AVISO_ERRO, true));
  }
}

function linkVoltar() {
  return el('a', { class: 'leitura__voltar', href: 'noticias.html', text: '← Todas as notícias' });
}

async function iniciarLeitura(container) {
  let noticias;
  try {
    noticias = await carregarNoticias();
  } catch (erro) {
    console.error(erro);
    montar(container, linkVoltar(), aviso(AVISO_ERRO, true));
    return;
  }

  const id = new URLSearchParams(location.search).get('id');
  const noticia = id ? buscar(noticias, id) : undefined;
  if (!noticia) {
    document.title = `Notícia não encontrada · ${TITULO_SITE}`;
    montar(container,
      linkVoltar(),
      el('h1', { text: 'Notícia não encontrada' }),
      el('p', { text: 'O endereço pode estar errado ou a notícia foi removida.' }),
    );
    return;
  }

  document.title = `${noticia.titulo} · ${TITULO_SITE}`;
  const meta = [formatarData(noticia.data), noticia.autor ? `Por ${noticia.autor}` : ''].filter(Boolean).join(' · ');
  montar(container,
    linkVoltar(),
    el('h1', { text: noticia.titulo }),
    el('p', { class: 'leitura__meta', text: meta }),
    imagemValida(noticia.imagem)
      ? el('img', { class: 'leitura__imagem', src: noticia.imagem, alt: `Imagem da notícia: ${noticia.titulo}` })
      : null,
    el('div', { class: 'leitura__texto' }, paragrafos(noticia.texto).map((paragrafo) => el('p', { text: paragrafo }))),
  );
}

const pagina = document.body.dataset.pagina;
if (pagina === 'home') iniciarLista(document.getElementById('noticias-lista'), 3, 'h3');
else if (pagina === 'lista') iniciarLista(document.getElementById('noticias-lista'), Infinity, 'h2');
else if (pagina === 'leitura') iniciarLeitura(document.getElementById('leitura'));
