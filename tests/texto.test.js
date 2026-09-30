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
