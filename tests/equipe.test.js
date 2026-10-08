import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarMembro, garantirIds, gerarIdMembro, adicionarMembro, atualizarMembro, removerMembro, moverMembro, LIMITE_BIO,
} from '../js/lib/equipe.js';

const m = (nome, extra = {}) => ({ nome, funcao: 'Repórter', bio: 'Bio.', foto: null, ...extra });

test('validarMembro exige nome e função e limita a bio', () => {
  assert.deepEqual(validarMembro(m('Ana')), []);
  assert.equal(validarMembro({ nome: ' ', funcao: 'x', bio: '' }).length, 1);
  assert.equal(validarMembro({ nome: 'Ana', funcao: '', bio: '' }).length, 1);
  assert.equal(validarMembro({ nome: 'Ana', funcao: 'x', bio: 'a'.repeat(LIMITE_BIO + 1) }).length, 1);
  assert.deepEqual(validarMembro({ nome: 'Ana', funcao: 'x', bio: '' }), []); // bio é opcional
});

test('gerarIdMembro usa o nome sem acentos e evita repetição', () => {
  assert.equal(gerarIdMembro('João Vítor', []), 'joao-vitor');
  assert.equal(gerarIdMembro('João Vitor', ['joao-vitor']), 'joao-vitor-2');
  assert.equal(gerarIdMembro('???', []), 'membro');
});

test('garantirIds dá id a quem não tem, sem mexer em quem já tem, e é determinístico', () => {
  const lista = [m('Ana'), m('Bia', { id: 'bia' }), m('Ana')];
  const a = garantirIds(lista);
  assert.deepEqual(a.map((x) => x.id), ['ana', 'bia', 'ana-2']);
  assert.deepEqual(garantirIds(lista), a);
  assert.equal(lista[0].id, undefined); // não altera a lista original
});

test('adicionarMembro põe no fim da lista e normaliza os campos', () => {
  const lista = garantirIds([m('Ana')]);
  const nova = adicionarMembro(lista, { nome: ' Bia ', funcao: ' Edição ', bio: ' oi\r\nlá ', foto: 'assets/equipe/bia.jpg' }, 'bia');
  assert.deepEqual(nova[1], { id: 'bia', nome: 'Bia', funcao: 'Edição', bio: 'oi\nlá', foto: 'assets/equipe/bia.jpg' });
  assert.equal(nova.length, 2);
});

test('adicionarMembro recusa id repetido', () => {
  assert.throws(() => adicionarMembro(garantirIds([m('Ana')]), m('Outra'), 'ana'), /Já existe/);
});

test('atualizarMembro troca os dados e mantém posição e id', () => {
  const lista = garantirIds([m('Ana'), m('Bia')]);
  const nova = atualizarMembro(lista, 'ana', { nome: 'Ana Lívia', funcao: 'Criadora', bio: 'x', foto: 'f.jpg' });
  assert.deepEqual(nova[0], { id: 'ana', nome: 'Ana Lívia', funcao: 'Criadora', bio: 'x', foto: 'f.jpg' });
  assert.equal(nova[1].nome, 'Bia');
});

test('atualizarMembro sem foto nos dados mantém a foto atual', () => {
  const lista = garantirIds([m('Ana', { foto: 'assets/equipe/a.jpg' })]);
  const nova = atualizarMembro(lista, 'ana', { nome: 'Ana', funcao: 'x', bio: '' });
  assert.equal(nova[0].foto, 'assets/equipe/a.jpg');
});

test('atualizar e remover membro inexistente falham', () => {
  assert.throws(() => atualizarMembro([], 'x', m('A')), /não existe mais/);
  assert.throws(() => removerMembro([], 'x'), /não existe mais/);
});

test('removerMembro tira só o escolhido', () => {
  const lista = garantirIds([m('Ana'), m('Bia')]);
  assert.deepEqual(removerMembro(lista, 'ana').map((x) => x.id), ['bia']);
});

test('moverMembro troca de lugar e não passa das pontas', () => {
  const lista = garantirIds([m('A'), m('B'), m('C')]);
  assert.deepEqual(moverMembro(lista, 'c', -1).map((x) => x.id), ['a', 'c', 'b']);
  assert.deepEqual(moverMembro(lista, 'a', 1).map((x) => x.id), ['b', 'a', 'c']);
  assert.deepEqual(moverMembro(lista, 'a', -1).map((x) => x.id), ['a', 'b', 'c']);
  assert.deepEqual(moverMembro(lista, 'c', 1).map((x) => x.id), ['a', 'b', 'c']);
});
