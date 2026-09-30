import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paragrafos } from '../js/lib/texto.js';

test('paragrafos separa por linhas em branco e ignora excesso', () => {
  assert.deepEqual(paragrafos('A\n\nB\n\n\n\nC'), ['A', 'B', 'C']);
});

test('paragrafos mantém quebras simples dentro do parágrafo', () => {
  assert.deepEqual(paragrafos('linha 1\nlinha 2\n\nB'), ['linha 1\nlinha 2', 'B']);
});

test('paragrafos normaliza quebras do Windows', () => {
  assert.deepEqual(paragrafos('A\r\n\r\nB'), ['A', 'B']);
});

test('paragrafos devolve lista vazia para texto vazio ou só espaços', () => {
  assert.deepEqual(paragrafos(''), []);
  assert.deepEqual(paragrafos('  \n\n  '), []);
  assert.deepEqual(paragrafos(undefined), []);
});

test('paragrafos não interpreta HTML', () => {
  assert.deepEqual(paragrafos('<b>oi</b>\n\n<script>x</script>'), ['<b>oi</b>', '<script>x</script>']);
});

import { blocos, imagensDoTexto } from '../js/lib/texto.js';

const so = (texto) => ({ tipo: 'texto', texto });

test('blocos: parágrafo simples vira um bloco de texto', () => {
  assert.deepEqual(blocos('Olá\n\nMundo'), [
    { tipo: 'paragrafo', partes: [so('Olá')] },
    { tipo: 'paragrafo', partes: [so('Mundo')] },
  ]);
});

test('blocos: negrito e itálico, inclusive misturados ao texto', () => {
  assert.deepEqual(blocos('a **forte** b *suave* c')[0].partes, [
    so('a '),
    { tipo: 'negrito', partes: [so('forte')] },
    so(' b '),
    { tipo: 'italico', partes: [so('suave')] },
    so(' c'),
  ]);
});

test('blocos: asteriscos soltos ou cercados por espaço continuam texto', () => {
  assert.deepEqual(blocos('2 * 3 * 4')[0].partes, [so('2 * 3 * 4')]);
});

test('blocos: link http/https/mailto vira link; outros esquemas ficam como texto', () => {
  assert.deepEqual(blocos('[site](https://exemplo.com/a?b=1)')[0].partes, [
    { tipo: 'link', href: 'https://exemplo.com/a?b=1', partes: [so('site')] },
  ]);
  assert.equal(blocos('[e-mail](mailto:a@b.com)')[0].partes[0].tipo, 'link');
  assert.ok(blocos('[x](javascript:alert(1))')[0].partes.every((p) => p.tipo === 'texto'));
  assert.deepEqual(blocos('[x](data:text/html;base64,AAAA)')[0].partes.map((p) => p.tipo), ['texto']);
  assert.deepEqual(blocos('[x](//evil.com)')[0].partes.map((p) => p.tipo), ['texto']);
});

test('blocos: negrito dentro de link e link dentro de negrito', () => {
  assert.deepEqual(blocos('[**oi**](https://a.com)')[0].partes[0].partes, [{ tipo: 'negrito', partes: [so('oi')] }]);
  assert.equal(blocos('**[oi](https://a.com)**')[0].partes[0].partes[0].tipo, 'link');
});

test('blocos: "## " abre subtítulo', () => {
  assert.deepEqual(blocos('## Parte 2\n\ntexto'), [
    { tipo: 'subtitulo', partes: [so('Parte 2')] },
    { tipo: 'paragrafo', partes: [so('texto')] },
  ]);
});

test('blocos: imagem sozinha no parágrafo (caminho do site ou https)', () => {
  assert.deepEqual(blocos('![Foto da feira](assets/noticias/corpo-1.jpg)'), [
    { tipo: 'imagem', src: 'assets/noticias/corpo-1.jpg', alt: 'Foto da feira' },
  ]);
  assert.deepEqual(blocos('![](https://exemplo.com/f.png)'), [
    { tipo: 'imagem', src: 'https://exemplo.com/f.png', alt: '' },
  ]);
});

test('blocos: imagem com endereço inseguro vira texto', () => {
  for (const ruim of ['javascript:alert(1)', 'http://exemplo.com/a.png', 'assets/noticias/../x.jpg', 'assets/outra/x.jpg', 'data:image/png;base64,AA']) {
    assert.equal(blocos(`![a](${ruim})`)[0].tipo, 'paragrafo', ruim);
  }
});

test('blocos: link de vídeo sozinho no parágrafo vira vídeo incorporado', () => {
  const esperado = { tipo: 'video', src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ' };
  assert.deepEqual(blocos('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), [esperado]);
  assert.deepEqual(blocos('https://youtu.be/dQw4w9WgXcQ?t=5'), [esperado]);
  assert.deepEqual(blocos('https://www.youtube.com/shorts/dQw4w9WgXcQ'), [esperado]);
  assert.deepEqual(blocos('https://vimeo.com/123456789'), [{ tipo: 'video', src: 'https://player.vimeo.com/video/123456789' }]);
});

test('blocos: URL de vídeo no meio de uma frase não vira vídeo', () => {
  assert.equal(blocos('veja https://youtu.be/dQw4w9WgXcQ agora')[0].tipo, 'paragrafo');
});

test('blocos: HTML digitado continua sendo texto', () => {
  assert.deepEqual(blocos('<img src=x onerror=alert(1)>'), [
    { tipo: 'paragrafo', partes: [so('<img src=x onerror=alert(1)>')] },
  ]);
});

test('blocos: texto antigo, sem marcação, não muda', () => {
  assert.deepEqual(blocos('linha 1\nlinha 2\n\nB'), [
    { tipo: 'paragrafo', partes: [so('linha 1\nlinha 2')] },
    { tipo: 'paragrafo', partes: [so('B')] },
  ]);
});

test('imagensDoTexto lista só as imagens hospedadas em assets/noticias/', () => {
  const texto = '![a](assets/noticias/corpo-1.jpg)\n\n![b](https://x.com/y.png)\n\n![c](assets/noticias/corpo-2.png)';
  assert.deepEqual(imagensDoTexto(texto), ['assets/noticias/corpo-1.jpg', 'assets/noticias/corpo-2.png']);
});

import { textoSimples } from '../js/lib/texto.js';

test('textoSimples tira a marcação e ignora imagens e vídeos', () => {
  const texto = '## Título\n\nUm **forte** e [link](https://a.com).\n\n![foto](assets/noticias/a.jpg)\n\nhttps://youtu.be/dQw4w9WgXcQ\n\nFim';
  assert.equal(textoSimples(texto), 'Título Um forte e link. Fim');
});

test('textoSimples junta espaços e quebras em um só espaço', () => {
  assert.equal(textoSimples('a   b\nc\n\nd'), 'a b c d');
});
