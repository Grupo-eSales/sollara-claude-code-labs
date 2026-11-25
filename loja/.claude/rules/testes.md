---
paths:
  - "tests/**/*.ts"
---

# Testes

- `node:test` + `node:assert/strict`. Um conceito por teste, nome descreve o comportamento em português.
- Estrutura dado / quando / então, sem comentários marcando as seções.
- `beforeEach(() => pedidosRepo.resetar())` em todo arquivo que toca pedidos.
- Teste de MCP usa `InMemoryTransport` (sem rede, sem LLM). Não suba servidor HTTP em teste unitário.
- Bug corrigido ganha teste de regressão que falha sem a correção.
