// Confere se a máquina está pronta para os laboratórios.  Uso: node labs/verificar-ambiente.mjs
// Não altera nada: só lê versões, roda os testes do projeto e verifica a porta 3000.
import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const loja = join(dirname(fileURLToPath(import.meta.url)), 'loja');
const rodar = (comando, cwd) => {
  const r = spawnSync(comando, { shell: true, cwd, encoding: 'utf8', timeout: 120_000 });
  return { ok: r.status === 0, saida: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
};
const versao = texto => texto.match(/\d+\.\d+(\.\d+)?/)?.[0] ?? '?';

const linhas = [];
let faltas = 0, avisos = 0;
const registrar = (nome, estado, detalhe, ajuda) => {
  if (estado === 'FALHOU') faltas++;
  if (estado === 'aviso') avisos++;
  linhas.push({ nome, estado, detalhe, ajuda });
};

// ---------- ferramentas ----------
const [maior, menor] = process.versions.node.split('.').map(Number);
registrar('Node.js', maior >= 22 ? 'ok' : 'FALHOU', `versão ${process.versions.node}`,
  'Instale o Node.js 22 ou mais novo (LTS).');
if (maior === 22 && menor < 13) registrar('Node.js (instrutor)', 'aviso', 'a aplicação de simulados pede 22.13+',
  'Só importa para quem vai subir a aplicação de simulados.');

for (const [nome, comando, ajuda] of [
  ['Git', 'git --version', 'Instale o Git.'],
  ['Claude Code', 'claude --version', 'Instale o Claude Code CLI e abra um terminal novo.'],
]) {
  const r = rodar(comando);
  registrar(nome, r.ok ? 'ok' : 'FALHOU', r.ok ? `versão ${versao(r.saida)}` : 'não encontrado', ajuda);
}

if (process.platform === 'win32') {
  const bash = rodar('where.exe bash');
  registrar('Git Bash', bash.ok ? 'ok' : 'aviso', bash.ok ? 'encontrado' : 'não encontrado no PATH',
    'O Git for Windows traz o Git Bash, que o Claude Code usa para rodar comandos. Sem ele o Claude usa o PowerShell, e os labs funcionam do mesmo jeito.');
}

// ---------- projeto ----------
if (!existsSync(join(loja, 'package.json'))) {
  registrar('Projeto labs/loja', 'FALHOU', 'pasta não encontrada', 'Rode este script a partir da pasta do treinamento.');
} else {
  const instalado = existsSync(join(loja, 'node_modules'));
  registrar('Dependências', instalado ? 'ok' : 'FALHOU', instalado ? 'node_modules presente' : 'npm install não foi rodado',
    'Rode em labs/loja: npm install');

  if (instalado) {
    const t = rodar('npm test', loja);
    const passaram = t.saida.match(/# pass (\d+)/)?.[1];
    registrar('Testes do projeto', t.ok ? 'ok' : 'FALHOU', t.ok ? `${passaram ?? '?'} passando` : 'npm test falhou',
      'Rode npm test em labs/loja e leia o erro. Se você alterou arquivos, compare com a cópia original.');
  }

  const topo = rodar('git rev-parse --show-toplevel', loja);
  const repoProprio = topo.ok && realpathSync(topo.saida) === realpathSync(loja);
  const temCommit = repoProprio && rodar('git rev-parse HEAD', loja).ok;
  registrar('Repositório git', temCommit ? 'ok' : 'FALHOU',
    temCommit ? `branch ${rodar('git branch --show-current', loja).saida}` : 'labs/loja sem commit base',
    'Rode em labs/loja: node ../preparar-lab.mjs inicio');

  const hooks = ['bloquear-comandos.mjs', 'typecheck-apos-editar.mjs'].every(h => existsSync(join(loja, '.claude', 'hooks', h)));
  const bloqueia = hooks && /saída: 2/.test(rodar('node .claude/hooks/bloquear-comandos.mjs "rm -rf x"', loja).saida);
  registrar('Hooks do projeto', bloqueia ? 'ok' : 'FALHOU', bloqueia ? 'bloqueio respondendo' : 'hook de bloqueio não respondeu',
    'Rode em labs/loja: node seguranca/testar-hooks.mjs e leia o resultado.');

  const envVersionado = rodar('git ls-files --error-unmatch .env', loja).ok;
  registrar('Segredos fora do git', envVersionado ? 'FALHOU' : 'ok', envVersionado ? '.env está versionado' : '.env ignorado',
    'O arquivo .env nunca deve ir para o git. Rode: git rm --cached .env');
}

// ---------- porta do Lab 3 ----------
const portaLivre = await new Promise(resolve => {
  const s = createServer();
  s.once('error', () => resolve(false));
  s.listen(3000, () => s.close(() => resolve(true)));
});
registrar('Porta 3000', portaLivre ? 'ok' : 'aviso', portaLivre ? 'livre' : 'em uso',
  'O Lab 3 sobe a aplicação na 3000. Feche o que estiver usando ou defina PORT no .env.');

// ---------- relatório ----------
console.log('\nTESTE DE AMBIENTE\nTreinamento Claude Code Avançado · Sollara\n');
for (const l of linhas) console.log(`${(l.nome + ' ').padEnd(24, '.')} ${l.estado}${l.detalhe ? ', ' + l.detalhe : ''}`);
const pendentes = linhas.filter(l => l.estado !== 'ok');
if (pendentes.length) {
  console.log('\nO que fazer:');
  for (const l of pendentes) console.log(`- ${l.nome}: ${l.ajuda}`);
}
console.log(`\n${faltas ? 'FALTA ALGO' : 'TUDO PRONTO'}${!faltas && avisos ? ' (com avisos)' : ''}`);
console.log('Falta só conferir o login: rode "claude doctor" ou abra "claude" uma vez.\n');
process.exitCode = faltas ? 1 : 0;
