import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarSlug, gerarId } from '../js/lib/slug.js';

test('gerarSlug remove acentos e símbolos e usa hífens', () => {
  assert.equal(gerarSlug('Feira de Ciências!'), 'feira-de-ciencias');
  assert.equal(gerarSlug('  Ação & Reação: 2 edição  '), 'acao-reacao-2-edicao');
});

test('gerarSlug limita o tamanho a 60 caracteres sem hífen no fim', () => {
  const slug = gerarSlug('a'.repeat(59) + ' bbbbbbbbbb');
  assert.equal(slug, 'a'.repeat(59));
});

test('gerarSlug devolve "noticia" quando não sobra nada', () => {
  assert.equal(gerarSlug('!!!'), 'noticia');
  assert.equal(gerarSlug(''), 'noticia');
  assert.equal(gerarSlug(undefined), 'noticia');
});

test('gerarId junta a data e o slug', () => {
  assert.equal(gerarId('2026-09-30', 'Feira de Ciências'), '2026-09-30-feira-de-ciencias');
});

test('gerarId acrescenta sufixo quando o id já existe', () => {
  const existentes = ['2026-09-30-feira', '2026-09-30-feira-2'];
  assert.equal(gerarId('2026-09-30', 'Feira', existentes), '2026-09-30-feira-3');
});
