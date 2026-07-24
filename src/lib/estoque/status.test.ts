import assert from 'node:assert/strict';
import test from 'node:test';

import { filtrarEstoque, normalizarStatusEstoque } from './status.ts';

const veiculos = [
  { status: 'Disponível', marca: 'Ford', modelo: 'Ka', placa: 'AAA1A11' },
  { status: 'vendido', marca: 'Honda', modelo: 'Civic', placa: 'BBB2B22' },
  { status: 'INDISPONIVEL', marca: 'Fiat', modelo: 'Toro', placa: 'CCC3C33' },
];

test('normaliza os três estados persistidos do estoque', () => {
  assert.equal(normalizarStatusEstoque('Disponível'), 'disponivel');
  assert.equal(normalizarStatusEstoque('INDISPONIVEL'), 'indisponivel');
  assert.equal(normalizarStatusEstoque('vendido'), 'vendido');
});

test('mostra somente disponíveis por padrão e permite filtrar outros status', () => {
  assert.deepEqual(filtrarEstoque(veiculos, { busca: '', marca: 'todas', status: 'disponivel' }), [veiculos[0]]);
  assert.deepEqual(filtrarEstoque(veiculos, { busca: '', marca: 'todas', status: 'vendido' }), [veiculos[1]]);
  assert.equal(filtrarEstoque(veiculos, { busca: '', marca: 'todas', status: 'todos' }).length, 3);
});
