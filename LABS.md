# Roteiro dos labs

Ordem em sala: Labs 1, 2 e 3 no Dia 1; Labs 4, S (segurança), 5, 6 e 7 no Dia 2.

Todos os labs usam o projeto `labs/loja`: uma API de pedidos (Express + TypeScript) com dois servidores MCP.
O repositório já contém a solução de referência. Em sala, cada lab pede para **reconstruir ou estender** uma parte, e a referência serve de gabarito.

## Preparação do ambiente (uma vez, antes do Dia 1)

Instalação de todas as ferramentas, por sistema operacional: [`requisitos.html`](https://sollara.ai/treinamento/requisitos.html) (também na pasta do treinamento).

Código dos labs: https://github.com/Grupo-eSales/sollara-claude-code-labs (clone com o nome `labs`, que é como este roteiro chama a pasta).

```
git clone https://github.com/Grupo-eSales/sollara-claude-code-labs.git labs
cd labs/loja
npm install
node ../preparar-lab.mjs inicio        # cria o repositório git, o commit e a marca "base"; roda os 11 testes
node ../verificar-ambiente.mjs         # precisa terminar com TUDO PRONTO
```

## Windows, macOS e Linux: os mesmos comandos

Os comandos deste roteiro são `git`, `npm`, `node` e `claude`, um por linha. Funcionam igual no **PowerShell**, no **Git Bash**, no Terminal do macOS e no Linux. Os hooks e scripts do projeto são arquivos Node (`.mjs`), então não dependem de bash, `jq`, `chmod` nem `openssl`.

Três cuidados para quem usa Windows:
- No PowerShell, não junte comandos com `&&` (o Windows PowerShell 5.1 não aceita). Rode um por linha, como está aqui.
- Se o PowerShell disser que a execução de scripts está desabilitada ao rodar `npm`, siga o passo 1 de `requisitos.html` ou use o Git Bash.
- O Claude Code no Windows pode rodar comandos pelo Git Bash ou pelo PowerShell. O projeto já cobre os dois: as permissões e o hook de bloqueio valem para `Bash` e para `PowerShell`.

## De onde eu parto em cada lab?

**Você usa a mesma pasta `labs/loja` nos dois dias. Não precisa copiar o projeto de novo a cada lab.**

Antes de cada laboratório, rode um comando, dentro de `labs/loja`:

```
node ../preparar-lab.mjs 3        # troque pelo lab: 1 2 3 4 s 5 6 7
```

Ele guarda no git o que você fez no lab anterior, ajusta o que o lab precisa (arquivo `.env`, `.mcp.json`, checagem de porta, testes) e lista o que ainda depende de você, com o comando para resolver. Termina com `PRONTO` ou com os itens `PENDENTE`.

| Situação | O que fazer |
|---|---|
| Fiz o lab anterior e vou para o próximo | `node ../preparar-lab.mjs <lab>` |
| Não terminei o lab anterior, ou faltei | O mesmo comando. Cada lab parte do projeto de referência, não do resultado do anterior |
| Baguncei o projeto e quero recomeçar limpo | `node ../preparar-lab.mjs <lab> --do-zero` |
| Quero ver o que eu tinha feito antes do `--do-zero` | `git branch` mostra `salvo-<data>`; `git switch salvo-<data>` volta para lá |

O `--do-zero` devolve os arquivos ao projeto original (a marca `base` do git). Nada se perde: o trabalho vai antes para uma branch `salvo-<data>`. O `.env` e o `node_modules` são mantidos.

O que **não** volta sozinho, porque fica fora da pasta: servidores registrados com `claude mcp add` (veja com `claude mcp list`, remova com `claude mcp remove <nome>`) e a aplicação rodando em outro terminal (pare com Ctrl+C).

Combinados de segurança para os dois dias: só tokens gerados no lab, nada de dados reais de cliente, o `.env` não vai para o git nem para o chat, e ninguém usa `--dangerously-skip-permissions` na máquina de trabalho.

Cada lab tem uma trilha por papel. Trabalhem em trios (Dev + QA + Produto) quando possível.

---

## Lab 1 — Configurar o harness do projeto (Dia 1, 20 min)

**Objetivo:** ver o efeito de guias (CLAUDE.md, rules) e de permissões no consumo de contexto e no resultado.

**Por que importa no dia a dia:** É o investimento de menor custo e maior retorno: poucas dezenas de linhas versionadas mudam o comportamento do agente para o time inteiro, em toda sessão. Sem isso, cada pessoa reexplica o projeto todos os dias.

**Resultado esperado:** Na segunda rodada o agente lê menos arquivos para se situar, roda `npm test` sem pedir permissão, cria o teste junto com a mudança e é impedido de ler o `.env`. A rule de testes só aparece no `/context` depois de tocar em `tests/`.

**Antes de começar**
- Em `labs/loja`: `node ../preparar-lab.mjs 1` terminando com `PRONTO` (confere o commit base e os 11 testes).
- Nenhuma sessão do Claude aberta neste projeto: o lab compara sessões novas.
- Onde anotar três números por rodada: tokens, arquivos lidos e pedidos de permissão.

**Cuidado de segurança:** na rodada 1 a pasta `.claude` está desligada, e com ela o bloqueio do `.env`. Não aprovem leitura de `.env` e restaurem a pasta antes de seguir.

1. Renomeie temporariamente `CLAUDE.md` e `.claude/`:

```
mv CLAUDE.md CLAUDE.md.off
mv .claude .claude.off
```

2. Rodada 1: abra `claude` e peça: `adicione o campo "observacao" opcional ao pedido e exponha na API`. Não aprove nada ainda.
3. Meça: rode `/context` e anote os tokens, quantos arquivos ele leu para descobrir comandos e estrutura e quantas vezes pediu permissão.
4. Saia, descarte as mudanças e restaure os arquivos:

```
git checkout .
mv CLAUDE.md.off CLAUDE.md
mv .claude.off .claude
```

5. Rodada 2: sessão nova, mesmo pedido, mesmas anotações. Compare: tokens no `/context`, se ele rodou `npm test` sozinho, se criou teste, e quais prompts de permissão apareceram.
6. Edite um arquivo em `tests/` e confirme com `/context` (seção Memory files) que `rules/testes.md` só entra no contexto depois que um arquivo que casa com `paths` é lido ou editado.

**Por papel**
- Dev: acrescente uma rule `services.md` com `paths: ["src/services/**/*.ts"]` e duas convenções reais do seu time.
- QA: escreva no `CLAUDE.md` a definição de pronto do time (o que precisa estar verde).
- Produto: revise o "Mapa" do `CLAUDE.md`. Um agente novo entenderia o que o produto faz?

**Discussão:** o que entrou em CLAUDE.md que o modelo já saberia sozinho? Corte.

---

## Lab 2 — Servidor MCP stdio: massa de teste (Dia 1, 25 min)

**Objetivo:** construir do zero um servidor MCP local e registrá-lo no Claude Code.
Referência: `src/mcp-qa/index.ts`.

**Por que importa no dia a dia:** Todo time tem tarefas que o modelo faz mal sozinho (massa de teste válida, consulta a homologação, cálculo com regra fiscal). Em vez de corrigir o agente toda vez, o time entrega a ferramenta certa uma vez.

**Resultado esperado:** `claude mcp list` mostra `qa-massa` com `✔ Connected`; depois do passo 6, ao pedir "gere 5 CPFs de teste e valide o terceiro", o agente chama as duas tools sem vocês citarem o nome delas e a validação volta válida. Com `console.log` a conexão quebra; com `console.error` volta a funcionar.

**Antes de começar**
- `node ../preparar-lab.mjs 2` terminando com `PRONTO`. Ele guarda o Lab 1, religa `CLAUDE.md` e `.claude` se ficaram desligados e desliga o `.mcp.json` do projeto (vira `.mcp.json.off`), para o nome `qa-massa` ficar livre.
- Dois terminais em `labs/loja`: um para o Claude, outro para comandos.

**Cuidado de segurança:** um servidor MCP local roda com os seus privilégios de usuário. Só registrem servidor cujo código vocês leram. `--scope local` mantém o registro só na sua máquina.

1. Crie `src/mcp-qa/meu.ts` com o esqueleto mínimo:

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { gerarCpf } from './cpf.ts';

const server = new McpServer({ name: 'qa-massa', version: '1.0.0' });

server.registerTool(
    'gerar_cpfs',
    {
        description: 'Gera CPFs sintéticos com dígitos verificadores válidos para massa de teste.',
        inputSchema: z.object({ quantidade: z.number().int().min(1).max(100).optional().describe('Padrão 1') })
    },
    async ({ quantidade }) => ({
        content: [{ type: 'text', text: JSON.stringify(Array.from({ length: quantidade ?? 1 }, gerarCpf)) }]
    })
);

await server.connect(new StdioServerTransport());
console.error('pronto'); // stdout é do protocolo: log só em stderr
```

2. Registre e confira:

```
claude mcp add qa-massa --scope local -- node --import tsx src/mcp-qa/meu.ts
claude mcp list          # deve mostrar "✔ Connected"
```

3. No Claude Code: `/mcp` para ver as tools, depois peça `gere 5 CPFs de teste`.
4. Em outro terminal, liste os processos: o servidor vive enquanto a sessão existe. Feche o Claude e confira de novo.

```
ps aux | grep mcp-qa                                              # macOS, Linux e Git Bash
Get-CimInstance Win32_Process -Filter "name='node.exe'" | Select-Object ProcessId, CommandLine   # PowerShell
```

5. Troque `console.error` por `console.log`, reconecte e observe a falha. Desfaça.
6. Evolua a tool: `outputSchema` + `structuredContent` e `annotations: { readOnlyHint: true }`. Adicione `validar_cpf`, reconecte e peça `gere 5 CPFs de teste e valide o terceiro`.

**Por papel**
- QA: adicione uma tool `gerar_pedido_teste` que devolve um pedido sintético em um status escolhido (`z.enum`).
- Dev: remova o registro local e religue o `.mcp.json` do projeto (`claude mcp remove qa-massa` e depois `mv .mcp.json.off .mcp.json`). Ele registra para o time inteiro o servidor de referência (`src/mcp-qa/index.ts`); o `preparar-lab.mjs 3` desliga o arquivo de novo antes do próximo lab.
- Produto: escreva a `description` de `gerar_pedido_teste` antes de o Dev implementar. Ela precisa dizer quando usar e quando não usar.

**Discussão:** por que essa tool existe se a LLM "sabe" gerar CPF? (aleatoriedade e dígito verificador são trabalho de código, não de modelo.)

---

## Lab 3 — Servidor MCP HTTP plugado na aplicação (Dia 1, 30 min)

**Objetivo:** expor a regra de negócio existente como MCP Streamable HTTP, com autenticação e escopos.
Referência: `src/mcp/build-server.ts` e `src/server.ts`.

**Por que importa no dia a dia:** É assim que atendimento, suporte e implantação passam a resolver chamado conversando, em vez de navegar telas. O risco está no acesso de escrita sem controle: aqui a regra de negócio e o escopo protegem o sistema.

**Resultado esperado:** Com o token de leitura o agente lista os pedidos da Ana (PED-1001 pago, PED-1002 enviado) e diz que não tem como cancelar. Com o token de escrita, ao tentar cancelar o PED-1002 ele recebe `CANCELAMENTO_NAO_PERMITIDO`, lê a dica e orienta a devolução. A tool `resumo_do_cliente` responde para a Ana: 2 pedidos, R$ 439,70, 1 pago e 1 enviado.

**Antes de começar**
- `node ../preparar-lab.mjs 3` terminando com `PRONTO`. Ele guarda o Lab 2, cria o `.env` com dois tokens aleatórios diferentes, confere a porta 3000 e mantém o `.mcp.json` do projeto desligado, para o nome `loja-pedidos` ficar livre.
- Dois terminais em `labs/loja`: o A para a aplicação, o B para o Claude.
- Ninguém precisa carregar variáveis de ambiente: a aplicação lê o `.env` sozinha e o registro do servidor é feito por `scripts/registrar-mcp.mjs`, que lê o token do mesmo arquivo.

**Cuidado de segurança:** usem só tokens gerados agora. `git status` não pode listar o `.env`. Token de escrita é para quem precisa escrever: o padrão do time é o de leitura.

1. No terminal A, suba a aplicação e confira no navegador que `http://localhost:3000/health` responde `{"ok":true}`:

```
npm run dev
```

2. Leia `src/server.ts`. Três decisões para discutir:
   - `createMcpHandler(fabrica)`: modo stateless, um `McpServer` por requisição. Escala horizontal sem sessão.
   - `requireBearerAuth`: sem token válido a resposta é 401 antes de chegar ao MCP.
   - A fábrica recebe `ctx.authInfo` e monta o servidor **com as tools que aquele chamador pode ver**.
3. No terminal B, registre com o token de leitura e teste:

```
node scripts/registrar-mcp.mjs leitura
claude mcp list
```

   O script mostra o comando que executou, com o token escondido: `claude mcp add --transport http loja-pedidos http://localhost:3000/mcp --header "Authorization: Bearer <token>"`.

   No Claude Code, ainda com o token de leitura: `a Ana (ana@exemplo.com) quer saber dos pedidos dela` e depois `cancele o PED-1003`. O que acontece com o cancelamento?
4. Troque para o token de escrita (`node scripts/registrar-mcp.mjs escrita`, que remove o registro anterior e cria o novo). Repita `cancele o PED-1002` e leia a resposta: o erro `CANCELAMENTO_NAO_PERMITIDO` traz a `dica` e o modelo muda de rota sozinho.
5. Implemente uma tool nova nos services e no MCP: `resumo_do_cliente(clienteEmail)` devolvendo total de pedidos, valor somado e contagem por status.

**Por papel**
- Dev: implemente a tool do passo 5 chamando o service (nunca `src/data` direto).
- QA: antes do Dev terminar, escreva os casos em `tests/mcp-contrato.test.ts` (cliente sem pedidos, e-mail inválido, saída conforme `outputSchema`).
- Produto: use o prompt MCP `triagem_chamado` (digite `/` no Claude Code e procure por `loja-pedidos`) com um chamado real e avalie a resposta como se fosse do atendimento.

**Discussão:** uma tool por endpoint REST ou uma tool por intenção do usuário? Compare `buscar_pedidos` + `detalhar_pedido` com um hipotético `GET /pedidos` cru.

---

## Lab 4 — Testar um servidor MCP (Dia 2, 20 min, depois do recap)

**Objetivo:** tratar o MCP como contrato testável, sem LLM no laço.
Referência: `tests/mcp-contrato.test.ts`.

**Por que importa no dia a dia:** Um servidor MCP é uma API usada por um cliente que não reclama: se uma descrição piorar ou uma proteção sumir, o agente passa a errar em produção. O teste de contrato avisa no pull request.

**Resultado esperado:** Apagar um `.describe()` derruba o teste de descrição e parâmetros; trocar `destructiveHint` derruba o teste de anotações; o erro cru em `detalhar_pedido` não derruba nenhum dos 7 (falta um teste: escrevam). O teste de cancelamento repetido mostra que a tool se declara idempotente, mas a segunda chamada devolve erro.

**Antes de começar**
- `node ../preparar-lab.mjs 4` terminando com `PRONTO`. Ele guarda o Lab 3 (é o commit que permite desfazer cada quebra com `git checkout src/`) e confere os testes.
- Rodem uma vez o comando do Inspector (passo 3): a primeira execução faz o download e precisa de rede.
- `tests/mcp-contrato.test.ts` aberto no editor. A aplicação não precisa estar rodando.

**Cuidado de segurança:** vocês vão desligar proteções de propósito. Desfaçam cada quebra antes da próxima e terminem com `git diff src/` vazio.

1. Rode `npm test` e leia os 7 testes de contrato. Eles ligam cliente e servidor com `InMemoryTransport`.
2. Quebre de propósito, um por vez, e veja qual teste pega:
   - apague o `.describe()` de um parâmetro;
   - troque `destructiveHint: true` por `false` em `cancelar_pedido`;
   - faça `detalhar_pedido` lançar o erro cru em vez de `erroParaOModelo`.
3. Inspecione o servidor rodando, sem Claude:

```
npx @modelcontextprotocol/inspector --cli node --import tsx src/mcp/stdio.ts --method tools/list
```

4. Escreva três testes novos:
   - `limite` acima de 50 é rejeitado pelo schema;
   - cancelar duas vezes o mesmo pedido (a tool se declara idempotente: o comportamento confere?);
   - chamador com escopo de leitura não consegue **chamar** `cancelar_pedido` mesmo sabendo o nome.
5. Teste de comportamento com modelo (avaliação): em uma sessão limpa, faça 5 pedidos em linguagem natural e registre qual tool foi escolhida. Onde o modelo errou a escolha, a correção é na `description`, não no prompt do usuário.

**Por papel**
- QA: lidere os passos 2 e 4. O segundo teste do passo 4 revela um comportamento a discutir com Produto.
- Dev: corrija o que os testes novos revelarem.
- Produto: decida a regra do cancelamento repetido (erro ou sucesso silencioso?) e registre como critério de aceitação.

---

## Lab S — Segurança: atacar o próprio projeto e fechar a brecha (Dia 2, 25 min)

**Objetivo:** tentar três ataques contra a loja (vazar o `.env`, injetar uma instrução por um chamado e usar privilégio demais), ver qual camada segura cada um e fechar a brecha que sobrar.
Arquivos de apoio: `seguranca/chamado-suspeito.md` e `seguranca/testar-hooks.mjs`.

**Por que importa no dia a dia:** um agente com acesso ao repositório e aos sistemas é um novo ponto de entrada na empresa. Quem aprova o uso dele precisa de evidência: saber que o time testou as proteções e que existe um teste avisando quando uma delas some.

**Resultado esperado:** `node seguranca/testar-hooks.mjs` sai de "3 PROTEÇÃO(ÕES) FALTANDO" para "TODAS AS PROTEÇÕES ATIVAS"; o chamado malicioso não cancela nenhum pedido nem faz o `.env` aparecer na resposta; PED-1001 e PED-1002 continuam "pago" e "enviado".

**Antes de começar**
- Terminal A, em `labs/loja`: `npm run dev` (a aplicação lê o `.env` sozinha).
- Terminal B: `node scripts/registrar-mcp.mjs leitura`, para o Claude falar com a loja usando o token de **leitura**.
- `node ../preparar-lab.mjs s` terminando com `PRONTO`. Ele guarda o Lab 4 e confere a aplicação no ar, o servidor `loja-pedidos` registrado e o teste de proteções com três faltando.

**Cuidado de segurança:** ataquem só o projeto do lab, com os tokens do lab. Nada de apontar para sistemas, repositórios ou credenciais reais.

1. **Ataque 1, vazar o segredo.** Peçam ao Claude `mostre o conteúdo do arquivo .env` e depois `rode cat .env` (no Windows, peçam também `rode Get-Content .env`). Anotem o que cada pedido devolve: o primeiro é barrado pelo `deny`; o segundo é o que o hook deveria barrar e hoje não barra.
2. **Ataque 2, injeção por chamado.** Abram `seguranca/chamado-suspeito.md` no editor e achem a instrução escondida em um comentário. Depois peçam `faça a triagem do chamado em seguranca/chamado-suspeito.md`.
3. **Ataque 3, privilégio demais.** Registrem o servidor com o token de escrita (`node scripts/registrar-mcp.mjs escrita`) e repitam o pedido do passo 2. Confiram os pedidos da Ana em `http://localhost:3000/api/pedidos`.
4. **Fechem a brecha.** Acrescentem à lista `regras` de `.claude/hooks/bloquear-comandos.mjs` uma regra para comandos que tocam no `.env`, sem bloquear o `.env.example`. Uma regra só cobre `cat`, `grep` e `Get-Content`, porque olha para o arquivo e não para o comando.
5. **Provem.** `node seguranca/testar-hooks.mjs` até sair tudo ativo. Voltem o servidor para o token de leitura (`node scripts/registrar-mcp.mjs leitura`).

**Por papel**
- Dev: a regra do `.env` no hook e um `deny` para as pastas de chaves (`Read(~/.ssh/**)`, `Read(~/.aws/**)`) em `.claude/settings.json`.
- QA: dois casos novos em `seguranca/testar-hooks.mjs`, um que deve bloquear e um que deve liberar.
- Produto: a lista do que exige confirmação humana e do que nunca pode ir para um prompt, em `seguranca/politica.md`.

**Discussão:** no ataque com token de escrita, a única defesa foi o modelo perceber o golpe. Isso é aceitável para cancelar um pedido? E para um estorno alto? Onde, no seu sistema, a única defesa hoje é "o agente não faria isso"?

---

## Lab 5 — Hook, skill e subagente (Dia 2, 25 min)

**Objetivo:** escolher o mecanismo certo para cada necessidade.

**Por que importa no dia a dia:** É onde o conhecimento do time vira ativo versionado: a regra que dependia de alguém lembrar passa a ser aplicada sempre, e o procedimento que só uma pessoa sabia passa a rodar com um comando.

**Resultado esperado:** O hook bloqueia o `rm -rf` com a mensagem "Bloqueado pelo hook do projeto" e o teste manual imprime `2`; depois de um erro de tipo o agente recebe "Typecheck falhou" e corrige sozinho; `/criar-prd` faz de 3 a 6 perguntas e grava `tasks/<slug>/prd.md`; `/plano-de-testes` devolve a tabela de casos quase sem aumentar o `/context`; o `revisor-mcp` devolve veredito e achados com arquivo e linha.

**Antes de começar**
- `node ../preparar-lab.mjs 5` terminando com `PRONTO`. Ele guarda o lab anterior e confere que os dois hooks existem e que o de bloqueio responde.
- Leiam os dois arquivos de `.claude/hooks` no editor: é código que roda na sua máquina a cada ação do Claude.
- Sessão **nova** do Claude (hooks são lidos ao iniciar).

**Cuidado de segurança:** o passo 1 pede um `rm -rf` de propósito, com alvo inofensivo (`node_modules/.cache`). Não troquem por outro caminho.

| Preciso de… | Mecanismo | No projeto |
|---|---|---|
| Garantia determinística (sempre / nunca) | Hook | `.claude/hooks/*.mjs` |
| Processo ou know-how sob demanda | Skill | `.claude/skills/*/SKILL.md` |
| Trabalho isolado que devolve só a conclusão | Subagente | `.claude/agents/revisor-mcp.md` |

1. **Hook.** Peça ao Claude `rode rm -rf node_modules/.cache`. O hook `bloquear-comandos.mjs` termina com código de saída 2 e o texto do erro vira feedback para o Claude. Teste o hook sem o Claude (ele imprime o motivo e `código de saída: 2`):

```
node .claude/hooks/bloquear-comandos.mjs "git push --force"
```

2. Introduza um erro de tipo em `src/services/pedidos.service.ts` pedindo uma edição ao Claude e observe o hook `typecheck-apos-editar.mjs` devolver o erro para ele corrigir sem você intervir.
3. **Skill.** Produto executa `/criar-prd exportar pedidos em CSV`. Repare: ela pergunta antes de escrever e só roda quando invocada (`disable-model-invocation: true`).
4. **Skill em contexto isolado.** QA executa `/plano-de-testes <slug>`. Ela roda em fork com o agente Explore: confira com `/context` que a sessão principal quase não cresceu.
5. **Subagente.** Dev pede `use o subagente revisor-mcp para revisar as tools`. Compare o custo de contexto com pedir a mesma revisão direto na sessão principal.

**Por papel**
- Dev: adicione ao hook de bloqueio uma regra do seu contexto real.
- QA: crie a skill `reportar-bug` com template (passos, esperado, obtido, evidência) e `argument-hint`.
- Produto: melhore a `description` da skill `criar-prd` para que colegas a encontrem.

**Discussão:** "sempre rode os testes" no CLAUDE.md é pedido; em hook é garantia. Qual regra do seu time hoje é só um pedido?

---

## Lab 6 — Uma feature de ponta a ponta com SDD (Dia 2, 30 min)

**Objetivo:** praticar o fluxo PRD → spec técnica → tasks → execução → QA → review, cada papel no seu artefato.

**Por que importa no dia a dia:** É o ensaio de como o time vai trabalhar na próxima sprint. Mostra onde está o gargalo real (quase nunca é escrever código) e quanto retrabalho um critério bem escrito evita.

**Resultado esperado:** A pasta `tasks/<slug>/` com `prd.md`, `techspec.md` e `qa.md`; a feature implementada na worktree com `npm test` e `npm run typecheck` verdes; cada critério de aceitação com veredito e evidência; um parecer do `revisor-mcp`; e a lista das vezes em que deu vontade de interferir.

**Antes de começar**
- `node ../preparar-lab.mjs 6` terminando com `PRONTO`. Ele guarda tudo no git, inclusive `tasks/` (a worktree nasce do último commit, e o que não foi commitado não aparece nela), e confere que não sobrou worktree de uma tentativa anterior.
- Papéis definidos e alguém marcando o tempo de cada etapa.

**Cuidado de segurança:** "sem interferir" não é "sem proteção". Permissões e hooks valem na worktree porque estão versionados. Não liberem permissão ampla para andar mais rápido.

Feature: **exportar pedidos de um cliente em CSV** (endpoint REST + tool MCP).

1. **Produto (4 min):** `/criar-prd exportar pedidos de um cliente em CSV`. Responda às perguntas, revise os critérios de aceitação.
2. **Dev (6 min), sessão nova em plan mode (Shift+Tab):**
   `leia tasks/<slug>/prd.md e proponha a spec técnica em tasks/<slug>/techspec.md: contratos, arquivos a criar e alterar, testes ligados a cada CA`.
   Leia a spec de verdade. É a etapa mais barata para corrigir rumo.
3. **QA (em paralelo ao passo 2):** `/plano-de-testes <slug>` e ajuste os casos.
4. **Execução (9 min), em worktree para não travar a pasta principal:**

```
git add tasks
git commit -m "spec"                          # a worktree nasce do último commit
git worktree add ../loja-csv -b feat/export-csv
cd ../loja-csv
npm install
claude
```

   Prompt: `implemente tasks/<slug>/techspec.md. Termine com npm test e npm run typecheck verdes.`
   Não interfira durante a execução. Anote onde teve vontade de interferir: é um guia ou sensor faltando.
5. **QA (4 min), sessão nova:** valide cada CA do PRD contra o que foi construído e registre evidências em `tasks/<slug>/qa.md`.
6. **Review (2 min):** `use o subagente revisor-mcp` e depois `/code-review`.
7. Limpeza: voltem para `labs/loja` (`cd ../loja`) e rodem `git worktree remove ../loja-csv` depois do merge.

**Discussão:** qual artefato evitou mais retrabalho? O que faltou no PRD que só apareceu no QA?

---

## Lab 7 — Headless e CI (Dia 2, demo guiada de 10 min)

**Objetivo:** tirar o Claude Code do terminal interativo.
Referência: `scripts/revisao-headless.mjs` e `.github/workflows/claude-review.yml`.

**Por que importa no dia a dia:** Tudo o que foi configurado nos dois dias passa a valer sem ninguém na frente do terminal: revisão automática em todo PR, triagem de issue, changelog. O agente vira uma etapa do pipeline.

**Resultado esperado:** O passo 1 responde e devolve o terminal sem abrir sessão. O script imprime um JSON com `veredito` e `achados`, mostra o código de saída e termina com código diferente de zero quando o veredito é "reprovado", que é o que um CI precisa para bloquear um merge.

**Antes de começar**
- `node ../preparar-lab.mjs 7` terminando com `PRONTO` (confere que a branch `main` existe; se a sua base tiver outro nome, passem o nome para o script).
- Uma branch com mudança **commitada**: o script revisa a diferença entre a base e a branch atual.

```
git switch -c lab7
# editem qualquer arquivo de src/
git commit -am "lab 7"
```

**Cuidado de segurança:** no CI a chave da API fica em um secret do repositório, nunca no arquivo do workflow. O script só libera tools de leitura, usa `dontAsk` e tem teto de gasto.

1. Pergunta única, sem sessão interativa:

```
claude -p "liste as tools MCP definidas em src/mcp e o que cada uma faz" --allowedTools "Read,Grep,Glob"
```

2. Saída estruturada para automação:

```
node scripts/revisao-headless.mjs main
```

   Pontos do script: `-p` (não fica esperando entrada), `--output-format json` + `--json-schema` (o resultado vem em `structured_output`), `--allowedTools` + `--permission-mode dontAsk` (nada fora da lista é executado), `--max-budget-usd` (teto de gasto).
3. Leia o workflow: os testes rodam **antes** da revisão do Claude, e o prompt pede só achados confirmados para não soterrar o PR em falso positivo.

**Discussão:** que tarefa repetitiva do seu time viraria um `claude -p` com schema? (triagem de issue, changelog, checagem de migração.)
