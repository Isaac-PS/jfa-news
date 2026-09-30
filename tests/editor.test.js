import { test } from 'node:test';
import assert from 'node:assert/strict';
import { envolver, prefixarLinha, inserirBloco, montarLink } from '../js/lib/editor.js';

test('envolver marca o trecho selecionado e mantém a seleção nele', () => {
  const r = envolver('uma palavra aqui', 4, 11, '**', 'texto');
  assert.equal(r.valor, 'uma **palavra** aqui');
  assert.equal(r.valor.slice(r.inicio, r.fim), 'palavra');
});

test('envolver sem seleção insere a marca com um texto de exemplo selecionado', () => {
  const r = envolver('ab', 1, 1, '*', 'itálico');
  assert.equal(r.valor, 'a*itálico*b');
  assert.equal(r.valor.slice(r.inicio, r.fim), 'itálico');
});

test('prefixarLinha coloca "## " no início da linha do cursor', () => {
  const r = prefixarLinha('primeira\nsegunda linha\nterceira', 12, 12, '## ');
  assert.equal(r.valor, 'primeira\n## segunda linha\nterceira');
});

test('prefixarLinha não repete o prefixo e o retira na segunda vez', () => {
  const r = prefixarLinha('## Título', 3, 3, '## ');
  assert.equal(r.valor, 'Título');
});

test('inserirBloco isola o bloco em parágrafo próprio no meio do texto', () => {
  const r = inserirBloco('antes depois', 6, 6, '![x](y)');
  assert.equal(r.valor, 'antes\n\n![x](y)\n\ndepois');
});

test('inserirBloco no início e no fim não deixa linhas em branco sobrando', () => {
  assert.equal(inserirBloco('', 0, 0, 'B').valor, 'B\n\n');
  assert.equal(inserirBloco('A', 1, 1, 'B').valor, 'A\n\nB\n\n');
  assert.equal(inserirBloco('A\n\n', 3, 3, 'B').valor, 'A\n\nB\n\n');
});

test('inserirBloco devolve o cursor depois do bloco', () => {
  const r = inserirBloco('A', 1, 1, 'B');
  assert.equal(r.inicio, r.valor.length);
  assert.equal(r.fim, r.valor.length);
});

test('montarLink usa a seleção como rótulo', () => {
  const r = montarLink('veja o site agora', 7, 11, 'https://a.com');
  assert.equal(r.valor, 'veja o [site](https://a.com) agora');
});

test('montarLink sem seleção usa o próprio endereço como rótulo', () => {
  const r = montarLink('', 0, 0, 'https://a.com');
  assert.equal(r.valor, '[https://a.com](https://a.com)');
});
