---
name: criar-prd
description: Cria o PRD de uma funcionalidade (o QUÊ, sem solução técnica) em tasks/<slug>/prd.md. Use quando alguém de produto descrever uma ideia ou pedir "PRD", "requisitos" ou "critérios de aceitação".
argument-hint: "<ideia em uma frase>"
disable-model-invocation: true
allowed-tools: Read Glob Grep Write
---

# Criar PRD

Ideia recebida: $ARGUMENTS

1. **Esclareça antes de escrever.** Faça de 3 a 6 perguntas objetivas (público, problema, métrica de sucesso, fora de escopo, restrições). Espere as respostas.
2. Leia `CLAUDE.md` para entender o produto atual. Não proponha arquitetura.
3. Escreva `tasks/<slug-kebab-case>/prd.md` seguindo [template.md](template.md).
4. Critérios de aceitação numerados `CA-01…`, no formato dado / quando / então, cada um verificável por um teste.
5. Termine listando as dúvidas que ficaram em aberto. Não invente regra de negócio para fechar lacuna.
