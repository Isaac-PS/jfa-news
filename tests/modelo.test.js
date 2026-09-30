import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITE_RESUMO,
  validar,
  ordenar,
  buscar,
  criarNoticia,
  editarNoticia,
  excluirNoticia,
} from '../js/lib/modelo.js';

const base = {
  titulo: 'Título',
  autor: 'Equipe',
  data: '2026-09-30',
  resumo: 'Resumo',
  texto: 'Texto',
};

test('validar aceita dados corretos', () => {
  assert.deepEqual(validar(base), []);
});

test('validar exige título e texto', () => {
  const erros = validar({ ...base, titulo: '  ', texto: '' });
  assert.equal(erros.length, 2);
  assert.match(erros[0], /título/i);
  assert.match(erros[1], /texto/i);
});

test('validar recusa data inexistente', () => {
  assert.equal(validar({ ...base, data: '2026-02-30' }).length, 1);
  assert.equal(validar({ ...base, data: '30/09/2026' }).length, 1);
  assert.equal(validar({ ...base, data: '' }).length, 1);
});

test('validar limita o resumo e o título', () => {
  assert.equal(validar({ ...base, resumo: 'x'.repeat(LIMITE_RESUMO + 1) }).length, 1);
  assert.deepEqual(validar({ ...base, resumo: 'x'.repeat(LIMITE_RESUMO) }), []);
  assert.equal(validar({ ...base, titulo: 'x'.repeat(121) }).length, 1);
});

test('validar aceita autor e resumo vazios', () => {
  assert.deepEqual(validar({ titulo: 'T', data: '2026-09-30', texto: 'X' }), []);
});

test('ordenar coloca a data mais recente primeiro e mantém a ordem nos empates', () => {
  const lista = [
    { id: 'a', data: '2026-09-01' },
    { id: 'b', data: '2026-09-30' },
    { id: 'c', data: '2026-09-30' },
  ];
  assert.deepEqual(ordenar(lista).map((n) => n.id), ['b', 'c', 'a']);
  assert.deepEqual(lista.map((n) => n.id), ['a', 'b', 'c']);
});

test('criarNoticia coloca no início, normaliza e não altera a lista original', () => {
  const lista = [{ id: 'velha', ...base }];
  const nova = criarNoticia(lista, { ...base, titulo: '  Novo  ', texto: 'A\r\nB  ' }, 'nova');
  assert.equal(nova.length, 2);
  assert.equal(nova[0].id, 'nova');
  assert.equal(nova[0].titulo, 'Novo');
  assert.equal(nova[0].texto, 'A\nB');
  assert.equal(nova[0].imagem, null);
  assert.equal(lista.length, 1);
});

test('criarNoticia recusa id repetido', () => {
  assert.throws(() => criarNoticia([{ id: 'x', ...base }], base, 'x'), /Já existe/);
});

test('editarNoticia mantém o id e a imagem quando a chave imagem não vem', () => {
  const lista = [{ id: 'x', ...base, imagem: 'assets/noticias/x.jpg' }];
  const editada = editarNoticia(lista, 'x', { ...base, titulo: 'Outro' });
  assert.equal(editada[0].id, 'x');
  assert.equal(editada[0].titulo, 'Outro');
  assert.equal(editada[0].imagem, 'assets/noticias/x.jpg');
});

test('editarNoticia troca ou remove a imagem quando a chave vem', () => {
  const lista = [{ id: 'x', ...base, imagem: 'assets/noticias/x.jpg' }];
  assert.equal(editarNoticia(lista, 'x', { ...base, imagem: null })[0].imagem, null);
});

test('editarNoticia e excluirNoticia falham para id inexistente', () => {
  assert.throws(() => editarNoticia([], 'x', base), /não existe mais/);
  assert.throws(() => excluirNoticia([], 'x'), /não existe mais/);
});

test('excluirNoticia remove só a notícia pedida', () => {
  const lista = [{ id: 'a', ...base }, { id: 'b', ...base }];
  assert.deepEqual(excluirNoticia(lista, 'a').map((n) => n.id), ['b']);
  assert.equal(buscar(lista, 'b').id, 'b');
});
