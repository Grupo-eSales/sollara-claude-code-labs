import { pedidosRepo, type Pedido, type StatusPedido } from '../data/pedidos.ts';

export class ErroDeNegocio extends Error {
    constructor(
        public readonly codigo: 'PEDIDO_NAO_ENCONTRADO' | 'CANCELAMENTO_NAO_PERMITIDO',
        message: string,
        public readonly dica: string
    ) {
        super(message);
    }
}

export type FiltroPedidos = { clienteEmail?: string; status?: StatusPedido; limite?: number };

const STATUS_CANCELAVEIS: StatusPedido[] = ['aguardando_pagamento', 'pago'];
const LIMITE_PADRAO = 20;

export function buscarPedidos(filtro: FiltroPedidos = {}): Pedido[] {
    return pedidosRepo
        .listar()
        .filter(pedido => !filtro.clienteEmail || pedido.clienteEmail === filtro.clienteEmail)
        .filter(pedido => !filtro.status || pedido.status === filtro.status)
        .slice(0, filtro.limite ?? LIMITE_PADRAO);
}

export function obterPedido(id: string): Pedido {
    const pedido = pedidosRepo.porId(id);
    if (!pedido) {
        const conhecidos = pedidosRepo.listar().map(atual => atual.id).join(', ');
        throw new ErroDeNegocio('PEDIDO_NAO_ENCONTRADO', `Pedido ${id} não existe.`, `Ids válidos: ${conhecidos}. Use buscar_pedidos para localizar pelo e-mail.`);
    }
    return pedido;
}

export function cancelarPedido(id: string, motivo: string): Pedido {
    const pedido = obterPedido(id);
    if (!STATUS_CANCELAVEIS.includes(pedido.status)) {
        throw new ErroDeNegocio(
            'CANCELAMENTO_NAO_PERMITIDO',
            `Pedido ${id} está "${pedido.status}" e não pode ser cancelado (motivo informado: ${motivo}).`,
            'Só é possível cancelar pedidos aguardando_pagamento ou pago. Para enviados/entregues, oriente o fluxo de devolução.'
        );
    }
    const cancelado: Pedido = { ...pedido, status: 'cancelado' };
    pedidosRepo.salvar(cancelado);
    return cancelado;
}
