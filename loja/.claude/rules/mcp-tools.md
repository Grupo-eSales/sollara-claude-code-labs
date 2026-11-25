---
paths:
  - "src/mcp/**/*.ts"
  - "src/mcp-qa/**/*.ts"
---

# Design de tools MCP

- Nome em `verbo_substantivo`, snake_case, sem prefixo do servidor.
- `description` responde: o que faz, QUANDO usar, o que retorna e qual tool usar no lugar quando não for o caso.
- Todo parâmetro tem `.describe()` com exemplo. Prefira `z.enum` a string livre.
- Retorne só o necessário: listas resumidas e paginadas; detalhe em outra tool.
- Sempre `outputSchema` + `structuredContent`.
- Erro de negócio: `isError: true` com `{ codigo, mensagem, dica, podeTentarDeNovo }`. Nunca stack trace.
- Leitura: `readOnlyHint: true`. Escrita: `destructiveHint` explícito e descrição pedindo confirmação.
- Em stdio, log somente em `console.error`.
- Toda tool nova entra em `tests/mcp-contrato.test.ts`.
