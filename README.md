# Claude Code Avançado — labs

Laboratórios do treinamento **Claude Code Avançado** da [Sollara](https://sollara.ai): harness, servidores MCP, segurança, hooks, skills, subagentes, Spec-Driven Development e Claude Code no CI.

| O quê | Onde |
|---|---|
| Roteiro dos 8 labs (7 numerados e o Lab S, de segurança) | [LABS.md](LABS.md) |
| Projeto de exemplo, já funcionando (API de pedidos + dois servidores MCP) | [loja](loja) |
| Slides do treinamento | https://sollara.ai/treinamento/slides |
| Preparação do ambiente, por sistema operacional | https://sollara.ai/treinamento/requisitos.html |

## Como começar

O roteiro e os scripts chamam esta pasta de `labs`. Clone com esse nome para os caminhos baterem:

```
git clone https://github.com/Grupo-eSales/sollara-claude-code-labs.git labs
cd labs/loja
npm install
npm test
node ../preparar-lab.mjs inicio
node ../verificar-ambiente.mjs
```

`npm test` deve terminar com 11 testes passando e `verificar-ambiente.mjs` com `TUDO PRONTO`. Os comandos são os mesmos no Windows (PowerShell ou Git Bash), no macOS e no Linux.

Antes de cada lab, dentro de `labs/loja`:

```
node ../preparar-lab.mjs 3        # inicio 1 2 3 4 s 5 6 7
```

O `preparar-lab.mjs inicio` cria um repositório git próprio dentro de `loja`, separado deste, para guardar o seu trabalho entre os labs. Com `--do-zero` o lab recomeça do projeto original e o que você fez fica em uma branch `salvo-<data>`.

## Requisitos

Conta paga do Claude, Node.js 22 ou mais novo, git e Claude Code atualizado e autenticado.
