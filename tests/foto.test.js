import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularRecorte, LADO_FOTO } from '../js/lib/foto.js';

test('foto vertical: quadrado da largura, posição escolhida no eixo vertical', () => {
  assert.deepEqual(calcularRecorte(1000, 1600, 0), { x: 0, y: 0, lado: 1000, saida: LADO_FOTO });
  assert.deepEqual(calcularRecorte(1000, 1600, 0.25), { x: 0, y: 150, lado: 1000, saida: LADO_FOTO });
  assert.deepEqual(calcularRecorte(1000, 1600, 1), { x: 0, y: 600, lado: 1000, saida: LADO_FOTO });
});

test('foto horizontal: a posição vale para o eixo horizontal', () => {
  assert.deepEqual(calcularRecorte(1600, 1000, 0.5), { x: 300, y: 0, lado: 1000, saida: LADO_FOTO });
});

test('foto quadrada não tem folga e a saída não passa do tamanho da imagem', () => {
  assert.deepEqual(calcularRecorte(300, 300, 0.7), { x: 0, y: 0, lado: 300, saida: 300 });
});

test('posição fora de 0 a 1 é limitada', () => {
  assert.equal(calcularRecorte(1000, 2000, -5).y, 0);
  assert.equal(calcularRecorte(1000, 2000, 9).y, 1000);
});
