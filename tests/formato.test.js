import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatarData,
  iniciais,
  linkWhatsapp,
  imagemValida,
  resumoOuInicio,
  usuarioInstagram,
  dataIsoLocal,
} from '../js/lib/formato.js';

test('formatarData escreve a data em português', () => {
  assert.equal(formatarData('2026-09-30'), '30 de setembro de 2026');
  assert.equal(formatarData('2026-01-05'), '5 de janeiro de 2026');
});

test('formatarData devolve vazio para valores inválidos', () => {
  assert.equal(formatarData('30/09/2026'), '');
  assert.equal(formatarData(undefined), '');
  assert.equal(formatarData('2026-13-40'), '');
});

test('iniciais usa o primeiro e o último nome', () => {
  assert.equal(iniciais('Maria Exemplo'), 'ME');
  assert.equal(iniciais('joão da silva'), 'JS');
  assert.equal(iniciais('Ana'), 'A');
  assert.equal(iniciais('   '), '?');
});

test('linkWhatsapp monta o link com a mensagem codificada', () => {
  assert.equal(
    linkWhatsapp('+55 85 99633-3970', 'Olá! Tenho interesse'),
    'https://wa.me/5585996333970?text=Ol%C3%A1!%20Tenho%20interesse',
  );
  assert.equal(linkWhatsapp('5585996333970'), 'https://wa.me/5585996333970');
});

test('imagemValida aceita só imagens dentro da pasta esperada', () => {
  assert.equal(imagemValida('assets/noticias/a.jpg'), true);
  assert.equal(imagemValida('assets/noticias/a.WEBP'), true);
  assert.equal(imagemValida('assets/equipe/ana.png', 'assets/equipe/'), true);
  assert.equal(imagemValida('assets/equipe/ana.png'), false);
  assert.equal(imagemValida('https://exemplo.com/a.jpg'), false);
  assert.equal(imagemValida('/etc/passwd'), false);
  assert.equal(imagemValida('assets/noticias/../../a.jpg'), false);
  assert.equal(imagemValida('assets/noticias/a.gif'), false);
  assert.equal(imagemValida('assets/noticias/a.jpg?x=1'), false);
  assert.equal(imagemValida(null), false);
});

test('resumoOuInicio usa o resumo quando existe', () => {
  assert.equal(resumoOuInicio({ resumo: ' Um resumo ', texto: 'Texto longo' }), 'Um resumo');
});

test('resumoOuInicio corta o texto quando não há resumo', () => {
  const texto = 'palavra '.repeat(40);
  const resultado = resumoOuInicio({ resumo: '', texto }, 50);
  assert.ok(resultado.length <= 50);
  assert.ok(resultado.endsWith('…'));
  assert.equal(resumoOuInicio({ texto: 'Curto\n\ntexto' }), 'Curto texto');
});

test('usuarioInstagram extrai o usuário da URL', () => {
  assert.equal(usuarioInstagram('https://www.instagram.com/jorna.lfa/'), 'jorna.lfa');
  assert.equal(usuarioInstagram('não é url'), '');
});

test('dataIsoLocal formata no fuso local', () => {
  assert.equal(dataIsoLocal(new Date(2026, 8, 5)), '2026-09-05');
});
