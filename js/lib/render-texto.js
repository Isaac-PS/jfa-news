import { el } from './dom.js';
import { blocos } from './texto.js';
import { imagemValida } from './formato.js';

function renderInline(partes) {
  return partes.map((parte) => {
    if (parte.tipo === 'texto') return parte.texto;
    if (parte.tipo === 'negrito') return el('strong', {}, renderInline(parte.partes));
    if (parte.tipo === 'italico') return el('em', {}, renderInline(parte.partes));
    const externo = /^https?:/i.test(parte.href);
    return el('a', { href: parte.href, target: externo ? '_blank' : null, rel: externo ? 'noopener noreferrer' : null }, renderInline(parte.partes));
  });
}

// `enderecoImagem` ajusta o endereço das imagens do próprio site (o painel fica numa subpasta).
export function renderizarTexto(texto, enderecoImagem = (caminho) => caminho) {
  return blocos(texto).map((b) => {
    if (b.tipo === 'subtitulo') return el('h2', {}, renderInline(b.partes));
    if (b.tipo === 'imagem') {
      const src = imagemValida(b.src) ? enderecoImagem(b.src) : b.src;
      return el('figure', { class: 'leitura__figura' },
        el('img', { src, alt: b.alt, loading: 'lazy' }),
        b.alt ? el('figcaption', { text: b.alt }) : null);
    }
    if (b.tipo === 'video') {
      return el('div', { class: 'leitura__video' },
        el('iframe', {
          src: b.src,
          title: 'Vídeo da notícia',
          loading: 'lazy',
          allow: 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen',
          referrerpolicy: 'strict-origin-when-cross-origin',
        }));
    }
    return el('p', {}, renderInline(b.partes));
  });
}
