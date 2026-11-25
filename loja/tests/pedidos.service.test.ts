import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { pedidosRepo } from '../src/data/pedidos.ts';
import { buscarPedidos, cancelarPedido, ErroDeNegocio } from '../src/services/pedidos.service.ts';
import { cpfValido, gerarCpf } from '../src/mcp-qa/cpf.ts';

beforeEach(() => pedidosRepo.resetar());

test('filtra pedidos por status', () => {
    assert.deepEqual(buscarPedidos({ status: 'pago' }).map(pedido => pedido.id), ['PED-1001']);
});

test('cancela pedido pago', () => {
    assert.equal(cancelarPedido('PED-1001', 'cliente desistiu').status, 'cancelado');
});

test('não cancela pedido enviado', () => {
    assert.throws(() => cancelarPedido('PED-1002', 'cliente desistiu'), ErroDeNegocio);
});

test('CPF gerado passa na validação e CPF adulterado não', () => {
    const cpf = gerarCpf();
    assert.ok(cpfValido(cpf));
    const adulterado = cpf.slice(0, 10) + ((Number(cpf[10]) + 1) % 10);
    assert.ok(!cpfValido(adulterado));
});
