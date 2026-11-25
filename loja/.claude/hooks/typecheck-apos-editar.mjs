// PostToolUse (Edit|Write): sensor automático.
// Se o typecheck falhar, o código de saída 2 devolve os erros ao Claude para ele corrigir sozinho.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let texto = '';
for await (const pedaco of process.stdin) texto += pedaco;
let arquivo = '';
try { arquivo = JSON.parse(texto).tool_input?.file_path ?? ''; } catch { /* entrada vazia: nada a checar */ }
if (!arquivo.endsWith('.ts')) process.exit(0);

const projeto = process.env.CLAUDE_PROJECT_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const r = spawnSync('npx tsc --noEmit', { cwd: projeto, shell: true, encoding: 'utf8' });
if (r.status !== 0) {
  const erros = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split(/\r?\n/).slice(0, 20).join('\n');
  console.error(`Typecheck falhou depois de editar ${arquivo}:\n${erros}`);
  process.exit(2);
}
