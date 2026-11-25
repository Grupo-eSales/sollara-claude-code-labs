// Teste de segurança do hook de bloqueio, sem o Claude: envia o mesmo JSON que o Claude Code
// enviaria e confere o código de saída (2 = bloqueado, 0 = liberado).
// Uso, a partir de labs/loja:  node seguranca/testar-hooks.mjs
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hook = join(dirname(fileURLToPath(import.meta.url)), '..', '.claude', 'hooks', 'bloquear-comandos.mjs');
let falhas = 0;

function caso(esperado, comando) {
  const r = spawnSync(process.execPath, [hook], { input: JSON.stringify({ tool_input: { command: comando } }) });
  const certo = r.status === esperado;
  if (!certo) falhas++;
  console.log(`${certo ? 'ok     ' : 'FALHOU '} esperado ${esperado}, obtido ${r.status}   ${comando}`);
}

console.log('Deve bloquear (2):');
caso(2, 'rm -rf node_modules');
caso(2, 'Remove-Item -Recurse -Force node_modules');
caso(2, 'git push --force origin main');
caso(2, 'git commit --no-verify -m x');
caso(2, 'cat .env');
caso(2, 'grep TOKEN .env');
caso(2, 'Get-Content .env');

console.log('\nDeve liberar (0):');
caso(0, 'npm test');
caso(0, 'git status');
caso(0, 'cat .env.example');

console.log(falhas ? `\n${falhas} PROTEÇÃO(ÕES) FALTANDO` : '\nTODAS AS PROTEÇÕES ATIVAS');
process.exit(falhas ? 1 : 0);
