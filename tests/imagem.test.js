import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarArquivoImagem, calcularDimensoes, TAMANHO_MAXIMO } from '../js/lib/imagem.js';

test('validarArquivoImagem aceita JPG, PNG e WebP dentro do limite', () => {
  assert.equal(validarArquivoImagem({ type: 'image/jpeg', size: 1000 }), null);
  assert.equal(validarArquivoImagem({ type: 'image/png', size: 1000 }), null);
  assert.equal(validarArquivoImagem({ type: 'image/webp', size: 1000 }), null);
});

test('validarArquivoImagem recusa outros formatos e arquivos grandes', () => {
  assert.match(validarArquivoImagem({ type: 'image/gif', size: 1000 }), /JPG, PNG ou WebP/);
  assert.match(validarArquivoImagem({ type: 'application/pdf', size: 1000 }), /JPG, PNG ou WebP/);
  assert.match(validarArquivoImagem({ type: 'image/png', size: TAMANHO_MAXIMO + 1 }), /15 MB/);
});

test('calcularDimensoes reduz imagens largas mantendo a proporção', () => {
  assert.deepEqual(calcularDimensoes(2400, 1600), { largura: 1200, altura: 800 });
  assert.deepEqual(calcularDimensoes(3000, 1000), { largura: 1200, altura: 400 });
});

test('calcularDimensoes não amplia imagens pequenas', () => {
  assert.deepEqual(calcularDimensoes(800, 600), { largura: 800, altura: 600 });
  assert.deepEqual(calcularDimensoes(1200, 900), { largura: 1200, altura: 900 });
});
