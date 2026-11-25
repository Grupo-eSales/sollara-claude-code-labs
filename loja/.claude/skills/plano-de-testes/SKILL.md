---
name: plano-de-testes
description: Deriva um plano de testes a partir dos critérios de aceitação de um PRD e aponta lacunas de cobertura. Use quando o QA pedir plano de testes, casos de teste, matriz de rastreabilidade ou revisão de cobertura de uma funcionalidade.
argument-hint: "<slug do PRD em tasks/>"
context: fork
agent: Explore
---

# Plano de testes

PRD alvo: `tasks/$ARGUMENTS/prd.md`

1. Leia o PRD e liste todos os `CA-xx`.
2. Localize os testes existentes em `tests/` que cobrem cada CA (cite `arquivo:linha`).
3. Para cada CA proponha casos: caminho feliz, limites, erro de negócio e, quando houver tool MCP, entrada fora do schema e chamador sem escopo.
4. Classifique cada caso pelo nível mais barato que o prova: unitário (service), contrato (MCP em memória) ou E2E.
5. Devolva somente:

| CA | Caso | Nível | Coberto por | Lacuna? |
|----|------|-------|-------------|---------|

e, ao final, as 3 lacunas de maior risco. Não escreva código.
