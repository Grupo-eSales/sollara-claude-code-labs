# Loja — API de pedidos + MCP

API REST (Express 5, TypeScript, ESM) com um servidor MCP exposto no mesmo processo.

## Comandos
- Instalar: `npm install`
- Rodar: `npm run dev` (porta `PORT`, padrão 3000; REST em `/api`, MCP em `/mcp`)
- Testar: `npm test` (node:test via tsx) — rode ao fim de toda tarefa
- Tipos: `npm run typecheck`
- MCP local: `npm run mcp:stdio` (pedidos) e `npm run mcp:qa` (massa de teste)

## Mapa
- `src/routes` e `src/server.ts`: HTTP. Sem regra de negócio.
- `src/services`: regra de negócio. Único lugar que lança `ErroDeNegocio`.
- `src/data`: acesso a dados (em memória).
- `src/mcp`: tools/resources/prompts. Só orquestra services, nunca acessa `src/data` direto.
- `tests`: testes de service e de contrato do MCP.

## Sempre
- Toda mudança de comportamento vem com teste. Tarefa só termina com `npm test` e `npm run typecheck` verdes.
- Segredos só por variável de ambiente (`.env.example` documenta os nomes).

## Nunca
- Nunca ler ou editar `.env`.
- Nunca criar tool MCP de escrita sem `annotations.destructiveHint` e sem checar escopo do chamador.

Regras por área em `.claude/rules/` (carregadas conforme o arquivo tocado).
