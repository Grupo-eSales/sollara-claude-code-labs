// Deixa o projeto labs/loja no ponto de partida de um laboratório e diz o que ainda falta.
// Funciona igual no Windows (PowerShell ou Git Bash), no macOS e no Linux.
//
// Uso, a partir de labs/loja:
//   node ../preparar-lab.mjs inicio        uma vez, antes do Dia 1
//   node ../preparar-lab.mjs 3             antes de cada lab: 1 2 3 4 s 5 6 7
//   node ../preparar-lab.mjs 3 --do-zero   recomeça do projeto original (o seu trabalho fica salvo em uma branch)
import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync, renameSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const loja = join(dirname(fileURLToPath(import.meta.url)), 'loja');
const LABS = ['inicio', '1', '2', '3', '4', 's', '5', '6', '7'];
const lab = (process.argv[2] ?? '').toLowerCase();
const doZero = process.argv.includes('--do-zero');

if (!LABS.includes(lab)) {
  console.log('Uso: node ../preparar-lab.mjs <inicio | 1 | 2 | 3 | 4 | s | 5 | 6 | 7> [--do-zero]');
  process.exit(1);
}

// ---------- utilitários ----------
const linhas = [];
let pendencias = 0;
const ok = texto => linhas.push(`ok        ${texto}`);
const feito = texto => linhas.push(`feito     ${texto}`);
const pendente = (texto, comoResolver) => { pendencias++; linhas.push(`PENDENTE  ${texto}\n          -> ${comoResolver}`); };

const git = (...args) => {
  const r = spawnSync('git', args, { cwd: loja, encoding: 'utf8' });
  return { ok: r.status === 0, saida: `${r.stdout ?? ''}`.trim(), erro: `${r.stderr ?? ''}`.trim() };
};
const shell = comando => {
  const r = spawnSync(comando, { cwd: loja, shell: true, encoding: 'utf8', timeout: 180_000 });
  return { ok: r.status === 0, saida: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
};
const existe = (...partes) => existsSync(join(loja, ...partes));
const renomear = (de, para) => renameSync(join(loja, de), join(loja, para));
const importar = caminho => import(pathToFileURL(join(loja, caminho)).href);
const portaLivre = porta => new Promise(resolve => {
  const s = createServer();
  s.once('error', () => resolve(false));
  s.listen(porta, () => s.close(() => resolve(true)));
});

// ---------- base: vale para todos os labs ----------
if (!existe('package.json')) {
  console.error('Não achei labs/loja. Este arquivo precisa ficar em labs/, ao lado da pasta loja.');
  process.exit(1);
}

if (existe('node_modules')) ok('dependências instaladas');
else {
  console.log('Instalando dependências (npm install)...');
  shell('npm install').ok ? feito('npm install') : pendente('npm install falhou', 'rode npm install em labs/loja e leia o erro');
}

// Lab 1 renomeia CLAUDE.md e .claude: se ficaram desligados, religa.
for (const [desligado, ligado] of [['CLAUDE.md.off', 'CLAUDE.md'], ['.claude.off', '.claude']]) {
  if (existe(desligado) && !existe(ligado)) { renomear(desligado, ligado); feito(`${ligado} restaurado (estava desligado desde o Lab 1)`); }
}

// Repositório git próprio de labs/loja, com a marca "base" no projeto original.
const topo = git('rev-parse', '--show-toplevel');
if (!topo.ok || realpathSync(topo.saida) !== realpathSync(loja)) {
  git('init', '-b', 'main');
  feito('repositório git criado em labs/loja');
}
if (!git('config', 'user.name').saida) git('config', 'user.name', 'Participante do lab');
if (!git('config', 'user.email').saida) git('config', 'user.email', 'lab@exemplo.com');

const temCommit = () => git('rev-parse', '--verify', 'HEAD').ok;
const sujo = () => git('status', '--porcelain').saida !== '';
const commitar = mensagem => { git('add', '-A'); return git('commit', '-m', mensagem).ok; };

if (!temCommit()) {
  commitar('base') ? feito('commit "base" com o projeto original') : pendente('não consegui criar o commit base', 'rode git status em labs/loja e leia o erro');
}
if (temCommit() && !git('rev-parse', '--verify', 'refs/tags/base').ok) {
  const primeiro = git('rev-list', '--max-parents=0', 'HEAD').saida.split(/\r?\n/)[0];
  git('tag', 'base', primeiro);
  feito('marca "base" criada: é o ponto para onde o --do-zero volta');
}

if (lab !== 'inicio' && temCommit()) {
  if (doZero) {
    const agora = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    if (sujo()) commitar(`trabalho salvo antes de recomeçar o lab ${lab}`);
    git('branch', `salvo-${agora}`);
    git('reset', '--hard', 'base');
    feito(`projeto de volta ao original. O que você tinha feito está na branch salvo-${agora}`);
  } else if (sujo()) {
    commitar(`antes do lab ${lab}`);
    feito(`trabalho anterior guardado no commit "antes do lab ${lab}"`);
  } else ok('nada pendente para guardar no git');
}

// ---------- o que cada lab precisa ----------
const desligarMcpDoProjeto = () => {
  if (existe('.mcp.json')) { renomear('.mcp.json', '.mcp.json.off'); feito('.mcp.json desligado (virou .mcp.json.off), para os nomes dos servidores ficarem livres'); }
  else ok('.mcp.json do projeto desligado');
};
const registrado = async nome => (await importar('scripts/claude-cli.mjs')).rodarClaude(['mcp', 'get', nome], { cwd: loja, timeout: 60_000 }).status === 0;
const garantirEnv = async () => {
  const { criarEnv, lerEnv } = await importar('scripts/criar-env.mjs');
  criarEnv() === 'criado' ? feito('.env criado com dois tokens de laboratório') : ok('.env com os dois tokens');
  return Number(lerEnv().PORT || 3000);
};
const testes = () => {
  const t = shell('npm test');
  const passaram = t.saida.match(/# pass (\d+)/)?.[1] ?? '?';
  t.ok ? ok(`npm test verde (${passaram} testes)`) : pendente('npm test está falhando', 'rode npm test e corrija, ou recomece com --do-zero');
};

let agora = '';

if (lab === 'inicio') {
  testes();
  agora = 'Ambiente do projeto pronto. Antes de cada laboratório rode: node ../preparar-lab.mjs <número do lab>';
}

if (lab === '1') {
  testes();
  agora = 'Feche qualquer sessão do Claude aberta neste projeto e siga o passo 1 do Lab 1.';
}

if (lab === '2') {
  desligarMcpDoProjeto();
  if (await registrado('qa-massa')) pendente('já existe um servidor "qa-massa" registrado', 'claude mcp remove qa-massa');
  else ok('nome "qa-massa" livre');
  agora = 'Abra dois terminais em labs/loja (um para o Claude, outro para comandos) e siga o passo 1 do Lab 2.';
}

if (lab === '3') {
  desligarMcpDoProjeto();
  const porta = await garantirEnv();
  (await portaLivre(porta)) ? ok(`porta ${porta} livre`)
    : pendente(`a porta ${porta} está em uso`, 'feche a aplicação que ficou rodando (Ctrl+C no terminal dela) ou mude PORT no .env');
  agora = 'Terminal A: npm run dev.  Terminal B: node scripts/registrar-mcp.mjs leitura  e depois  claude.';
}

if (lab === '4') {
  testes();
  git('diff', '--quiet', 'HEAD', '--', 'src').ok ? ok('src/ sem mudanças pendentes') : pendente('src/ tem mudanças não guardadas', 'rode de novo este comando');
  agora = 'Abra tests/mcp-contrato.test.ts no editor e siga o passo 1 do Lab 4. A aplicação não precisa estar no ar.';
}

if (lab === 's') {
  desligarMcpDoProjeto();
  const porta = await garantirEnv();
  const noAr = await fetch(`http://localhost:${porta}/health`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok, () => false);
  noAr ? ok(`aplicação no ar na porta ${porta}`) : pendente('a aplicação não está no ar', 'em outro terminal, em labs/loja: npm run dev');
  (await registrado('loja-pedidos')) ? ok('servidor "loja-pedidos" registrado no Claude Code')
    : pendente('servidor "loja-pedidos" não está registrado', 'node scripts/registrar-mcp.mjs leitura');
  const t = shell('node seguranca/testar-hooks.mjs');
  const faltando = t.saida.match(/(\d+) PROTEÇÃO/)?.[1];
  faltando ? ok(`teste de proteções rodou: ${faltando} faltando (é o ponto de partida do lab)`)
    : ok('teste de proteções rodou: todas ativas (a brecha já foi fechada; use --do-zero para refazer o lab)');
  agora = 'Se o lab anterior terminou com o token de escrita, rode: node scripts/registrar-mcp.mjs leitura. Depois siga o passo 1 do Lab S.';
}

if (lab === '5') {
  const hooks = ['bloquear-comandos.mjs', 'typecheck-apos-editar.mjs'].every(h => existe('.claude', 'hooks', h));
  hooks ? ok('os dois hooks estão em .claude/hooks') : pendente('faltam hooks em .claude/hooks', 'recomece com --do-zero');
  if (hooks) {
    const t = shell('node .claude/hooks/bloquear-comandos.mjs "rm -rf x"');
    /saída: 2/.test(t.saida) ? ok('hook de bloqueio responde (código de saída 2 para rm -rf)') : pendente('o hook de bloqueio não respondeu como esperado', 'rode node seguranca/testar-hooks.mjs e leia o resultado');
  }
  agora = 'Leia os dois arquivos de .claude/hooks e abra uma sessão NOVA do Claude (hooks são lidos ao iniciar).';
}

if (lab === '6') {
  existe('tasks') ? ok('pasta tasks/ presente (PRD do Lab 5)') : ok('sem tasks/ ainda: o passo 1 do lab cria o PRD');
  const arvores = git('worktree', 'list').saida.split(/\r?\n/).filter(Boolean).length;
  arvores <= 1 && !existsSync(join(loja, '..', 'loja-csv')) ? ok('nenhuma worktree antiga')
    : pendente('existe uma worktree ou pasta ../loja-csv de uma tentativa anterior', 'git worktree remove --force ../loja-csv');
  agora = 'Definam os papéis (Produto, Dev, QA), alguém marca o tempo, e sigam o passo 1 do Lab 6.';
}

if (lab === '7') {
  git('rev-parse', '--verify', 'main').ok ? ok('branch main existe (é a base da revisão)')
    : pendente('não existe branch main', 'use o nome da sua branch base: node scripts/revisao-headless.mjs <nome>');
  agora = 'Crie uma branch com uma mudança commitada (git switch -c lab7, edite um arquivo, git commit -am "lab 7") e siga o passo 1.';
}

// ---------- relatório ----------
const titulo = lab === 'inicio' ? 'PREPARAÇÃO INICIAL' : `PREPARAÇÃO DO LAB ${lab.toUpperCase()}`;
console.log(`\n${titulo}\n`);
for (const l of linhas) console.log(l);
console.log(pendencias ? `\nFALTA RESOLVER ${pendencias} ITEM(NS) marcados como PENDENTE. Resolva e rode este comando de novo.` : `\nPRONTO.`);
console.log(`\nAgora: ${agora}\n`);
process.exitCode = pendencias ? 1 : 0;
