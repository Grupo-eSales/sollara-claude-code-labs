// PreToolUse (Bash e PowerShell): guardrail determinístico.
// Código de saída 2 bloqueia a chamada e o texto do stderr vira feedback para o Claude.
// Em Node para rodar igual no Windows, no macOS e no Linux.
//
// Teste sem o Claude:  node .claude/hooks/bloquear-comandos.mjs "git push --force"

const regras = [
  { se: /rm -rf/,                  motivo: 'rm -rf não é permitido. Remova arquivos específicos.' },
  { se: /Remove-Item.*-Recurse/i,  motivo: 'remoção recursiva não é permitida. Remova arquivos específicos.' },
  { se: /git push (--force|-f)\b/, motivo: 'force push não é permitido. Abra um PR.' },
  { se: /--no-verify/,             motivo: 'não pule os hooks de git. Corrija a causa.' },
  { se: /drop table/i,             motivo: 'DDL destrutivo: gere a migration e peça para um humano executar.' },
];

const teste = process.argv[2];
const comando = teste ?? (await lerPedido()).tool_input?.command ?? '';

const regra = regras.find(r => r.se.test(comando));
if (regra) console.error(`Bloqueado pelo hook do projeto: ${regra.motivo}`);
if (teste !== undefined) console.log(`código de saída: ${regra ? 2 : 0}`);
process.exit(regra ? 2 : 0);

// O Claude Code envia a chamada da tool como JSON na entrada padrão.
async function lerPedido() {
  let texto = '';
  for await (const pedaco of process.stdin) texto += pedaco;
  try { return JSON.parse(texto); } catch { return {}; }
}
