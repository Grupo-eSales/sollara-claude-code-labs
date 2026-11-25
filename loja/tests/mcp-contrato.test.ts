import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { pedidosRepo } from '../src/data/pedidos.ts';
import { buildServer, type Chamador } from '../src/mcp/build-server.ts';

// Teste de contrato do MCP: cliente e servidor ligados em memória, sem rede e sem LLM.
async function conectar(chamador?: Chamador) {
    const [ladoCliente, ladoServidor] = InMemoryTransport.createLinkedPair();
    await buildServer(chamador).connect(ladoServidor);
    const client = new Client({ name: 'teste-contrato', version: '1.0.0' });
    await client.connect(ladoCliente);
    return client;
}

beforeEach(() => pedidosRepo.resetar());

test('toda tool tem descrição útil e parâmetros descritos', async () => {
    const client = await conectar();
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name).sort(), ['buscar_pedidos', 'cancelar_pedido', 'detalhar_pedido']);
    for (const tool of tools) {
        assert.ok((tool.description ?? '').length >= 60, `${tool.name}: descrição curta demais`);
        const propriedades = Object.entries((tool.inputSchema.properties ?? {}) as Record<string, { description?: string }>);
        for (const [nome, schema] of propriedades) assert.ok(schema.description, `${tool.name}.${nome} sem describe()`);
    }
});

test('tool destrutiva é anotada e as de leitura são readOnly', async () => {
    const client = await conectar();
    const { tools } = await client.listTools();
    const porNome = Object.fromEntries(tools.map(tool => [tool.name, tool.annotations]));
    assert.equal(porNome.cancelar_pedido?.destructiveHint, true);
    assert.equal(porNome.buscar_pedidos?.readOnlyHint, true);
});

test('buscar_pedidos devolve structuredContent filtrado', async () => {
    const client = await conectar();
    const resultado = await client.callTool({ name: 'buscar_pedidos', arguments: { clienteEmail: 'ana@exemplo.com' } });
    const saida = resultado.structuredContent as { total: number; pedidos: { id: string }[] };
    assert.equal(saida.total, 2);
    assert.deepEqual(saida.pedidos.map(pedido => pedido.id), ['PED-1001', 'PED-1002']);
});

test('erro de negócio volta como isError com dica acionável', async () => {
    const client = await conectar();
    const resultado = await client.callTool({ name: 'cancelar_pedido', arguments: { id: 'PED-1004', motivo: 'cliente desistiu' } });
    assert.equal(resultado.isError, true);
    const erro = JSON.parse((resultado.content as { text: string }[])[0].text);
    assert.equal(erro.codigo, 'CANCELAMENTO_NAO_PERMITIDO');
    assert.equal(erro.podeTentarDeNovo, false);
    assert.match(erro.dica, /devolução/);
});

test('entrada fora do schema nem chega ao handler', async () => {
    const client = await conectar();
    const resultado = await client.callTool({ name: 'detalhar_pedido', arguments: { id: '1001' } });
    assert.equal(resultado.isError, true);
});

test('chamador sem escopo de escrita não enxerga cancelar_pedido', async () => {
    const client = await conectar({ clientId: 'atendimento', scopes: ['mcp', 'pedidos:leitura'] });
    const { tools } = await client.listTools();
    assert.ok(!tools.some(tool => tool.name === 'cancelar_pedido'));
});

test('resource de política é legível', async () => {
    const client = await conectar();
    const { contents } = await client.readResource({ uri: 'loja://politicas/cancelamento' });
    assert.match((contents[0] as { text: string }).text, /Política de cancelamento/);
});
