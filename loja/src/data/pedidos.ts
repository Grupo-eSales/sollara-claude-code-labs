export type StatusPedido = 'aguardando_pagamento' | 'pago' | 'enviado' | 'entregue' | 'cancelado';

export type Pedido = {
    id: string;
    clienteEmail: string;
    status: StatusPedido;
    total: number;
    criadoEm: string;
    itens: { sku: string; quantidade: number; precoUnitario: number }[];
};

const seed: Pedido[] = [
    { id: 'PED-1001', clienteEmail: 'ana@exemplo.com', status: 'pago', total: 349.8, criadoEm: '2026-11-18', itens: [{ sku: 'TEC-001', quantidade: 2, precoUnitario: 174.9 }] },
    { id: 'PED-1002', clienteEmail: 'ana@exemplo.com', status: 'enviado', total: 89.9, criadoEm: '2026-11-19', itens: [{ sku: 'MOU-010', quantidade: 1, precoUnitario: 89.9 }] },
    { id: 'PED-1003', clienteEmail: 'bruno@exemplo.com', status: 'aguardando_pagamento', total: 1299, criadoEm: '2026-11-20', itens: [{ sku: 'MON-027', quantidade: 1, precoUnitario: 1299 }] },
    { id: 'PED-1004', clienteEmail: 'carla@exemplo.com', status: 'entregue', total: 59.8, criadoEm: '2026-11-10', itens: [{ sku: 'CAB-003', quantidade: 2, precoUnitario: 29.9 }] },
    { id: 'PED-1005', clienteEmail: 'bruno@exemplo.com', status: 'cancelado', total: 210, criadoEm: '2026-11-12', itens: [{ sku: 'HEA-005', quantidade: 1, precoUnitario: 210 }] }
];

let pedidos: Pedido[] = structuredClone(seed);

export const pedidosRepo = {
    listar: (): Pedido[] => pedidos,
    porId: (id: string): Pedido | undefined => pedidos.find(pedido => pedido.id === id),
    salvar: (pedido: Pedido): void => {
        pedidos = pedidos.map(atual => (atual.id === pedido.id ? pedido : atual));
    },
    resetar: (): void => {
        pedidos = structuredClone(seed);
    }
};
