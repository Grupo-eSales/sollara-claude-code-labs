import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { buscarPedidos, cancelarPedido, ErroDeNegocio, obterPedido } from '../services/pedidos.service.ts';

const STATUS = ['aguardando_pagamento', 'pago', 'enviado', 'entregue', 'cancelado'] as const;

const pedidoSchema = z.object({
    id: z.string(),
    clienteEmail: z.string(),
    status: z.enum(STATUS),
    total: z.number(),
    criadoEm: z.string(),
    itens: z.array(z.object({ sku: z.string(), quantidade: z.number(), precoUnitario: z.number() }))
});

function erroParaOModelo(erro: unknown) {
    const negocio = erro instanceof ErroDeNegocio;
    const payload = {
        codigo: negocio ? erro.codigo : 'ERRO_INTERNO',
        mensagem: erro instanceof Error ? erro.message : String(erro),
        dica: negocio ? erro.dica : 'Falha transitória: tente novamente uma vez; se persistir, avise o usuário.',
        podeTentarDeNovo: !negocio
    };
    return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify(payload) }] };
}

export type Chamador = { clientId: string; scopes: string[] };

export function buildServer(chamador?: Chamador): McpServer {
    const server = new McpServer({ name: 'loja-pedidos', version: '1.0.0' });
    const podeEscrever = !chamador || chamador.scopes.includes('pedidos:escrita');

    server.registerTool(
        'buscar_pedidos',
        {
            title: 'Buscar pedidos',
            description:
                'Lista pedidos da loja filtrando por e-mail do cliente e/ou status. Use quando o usuário quer localizar pedidos e ainda NÃO tem o id. ' +
                'Retorna no máximo `limite` pedidos (padrão 20), sem os itens. Para ver itens de um pedido específico use detalhar_pedido.',
            inputSchema: z.object({
                clienteEmail: z.string().email().optional().describe('E-mail exato do cliente, ex.: ana@exemplo.com'),
                status: z.enum(STATUS).optional().describe('Filtra por um único status'),
                limite: z.number().int().min(1).max(50).optional().describe('Máximo de pedidos retornados. Padrão 20')
            }),
            outputSchema: z.object({ total: z.number(), pedidos: z.array(pedidoSchema.omit({ itens: true })) }),
            annotations: { readOnlyHint: true }
        },
        async filtro => {
            const pedidos = buscarPedidos(filtro).map(({ itens: _itens, ...resumo }) => resumo);
            const saida = { total: pedidos.length, pedidos };
            return { content: [{ type: 'text', text: JSON.stringify(saida) }], structuredContent: saida };
        }
    );

    server.registerTool(
        'detalhar_pedido',
        {
            title: 'Detalhar pedido',
            description: 'Retorna um pedido completo (com itens) a partir do id no formato PED-0000. Use depois de buscar_pedidos ou quando o usuário informar o id.',
            inputSchema: z.object({ id: z.string().regex(/^PED-\d{4}$/).describe('Id do pedido, ex.: PED-1001') }),
            outputSchema: pedidoSchema,
            annotations: { readOnlyHint: true }
        },
        async ({ id }) => {
            try {
                const pedido = obterPedido(id);
                return { content: [{ type: 'text', text: JSON.stringify(pedido) }], structuredContent: pedido };
            } catch (erro) {
                return erroParaOModelo(erro);
            }
        }
    );

    if (podeEscrever) {
        server.registerTool(
            'cancelar_pedido',
            {
                title: 'Cancelar pedido',
                description:
                    'Cancela um pedido. AÇÃO IRREVERSÍVEL: confirme com o usuário antes de chamar. Só funciona para pedidos aguardando_pagamento ou pago; ' +
                    'para enviado/entregue retorna erro CANCELAMENTO_NAO_PERMITIDO com a orientação de devolução.',
                inputSchema: z.object({
                    id: z.string().regex(/^PED-\d{4}$/).describe('Id do pedido, ex.: PED-1003'),
                    motivo: z.string().min(5).describe('Motivo informado pelo cliente, em uma frase')
                }),
                outputSchema: pedidoSchema,
                annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true }
            },
            async ({ id, motivo }) => {
                try {
                    const pedido = cancelarPedido(id, motivo);
                    return { content: [{ type: 'text', text: JSON.stringify(pedido) }], structuredContent: pedido };
                } catch (erro) {
                    return erroParaOModelo(erro);
                }
            }
        );
    }

    server.registerResource(
        'politica-cancelamento',
        'loja://politicas/cancelamento',
        { title: 'Política de cancelamento', description: 'Regras de negócio de cancelamento e devolução', mimeType: 'text/markdown' },
        async uri => ({
            contents: [
                {
                    uri: uri.href,
                    text: '# Política de cancelamento\n\n- Cancelamento direto: pedidos `aguardando_pagamento` ou `pago`.\n- Pedidos `enviado` ou `entregue`: abrir devolução em até 7 dias.\n- Pedidos `cancelado` não podem ser reabertos.\n'
                }
            ]
        })
    );

    server.registerPrompt(
        'triagem_chamado',
        {
            title: 'Triagem de chamado',
            description: 'Roteiro para o atendimento investigar um chamado sobre pedido',
            argsSchema: z.object({ relato: z.string().describe('Texto do chamado do cliente') })
        },
        ({ relato }) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Chamado do cliente: "${relato}"\n\n1. Localize o pedido com buscar_pedidos/detalhar_pedido.\n2. Leia loja://politicas/cancelamento.\n3. Proponha a ação e peça minha confirmação antes de qualquer cancelamento.`
                    }
                }
            ]
        })
    );

    return server;
}
