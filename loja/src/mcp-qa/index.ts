import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { cpfValido, gerarCpf } from './cpf.ts';

// MCP local (stdio) de apoio ao QA: dados que uma LLM NÃO gera de forma confiável (aleatoriedade e dígitos verificadores).

const server = new McpServer({ name: 'qa-massa', version: '1.0.0' });

server.registerTool(
    'gerar_cpfs',
    {
        title: 'Gerar CPFs de teste',
        description: 'Gera CPFs sintéticos com dígitos verificadores válidos para massa de teste. Nunca use para dados reais.',
        inputSchema: z.object({ quantidade: z.number().int().min(1).max(100).optional().describe('Quantos CPFs gerar. Padrão 1') }),
        outputSchema: z.object({ cpfs: z.array(z.string()) }),
        annotations: { readOnlyHint: true }
    },
    async ({ quantidade }) => {
        const saida = { cpfs: Array.from({ length: quantidade ?? 1 }, gerarCpf) };
        return { content: [{ type: 'text', text: JSON.stringify(saida) }], structuredContent: saida };
    }
);

server.registerTool(
    'validar_cpf',
    {
        title: 'Validar CPF',
        description: 'Confere os dígitos verificadores de um CPF (com ou sem máscara). Use para checar massa de teste ou saída da aplicação.',
        inputSchema: z.object({ cpf: z.string().describe('CPF com ou sem pontuação') }),
        outputSchema: z.object({ cpf: z.string(), valido: z.boolean() }),
        annotations: { readOnlyHint: true }
    },
    async ({ cpf }) => {
        const saida = { cpf, valido: cpfValido(cpf) };
        return { content: [{ type: 'text', text: JSON.stringify(saida) }], structuredContent: saida };
    }
);

await server.connect(new StdioServerTransport());
console.error('[qa-massa] MCP stdio pronto');
