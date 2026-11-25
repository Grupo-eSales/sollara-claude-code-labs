// Revisão não interativa do diff atual. Saída em JSON validado por schema, pronta para um gate de CI.
// Uso, a partir de labs/loja:  node scripts/revisao-headless.mjs [base]     (padrão: main)
// Termina com código 1 quando o veredito é "reprovado": é o que um CI usa para bloquear o merge.
import { spawnSync } from 'node:child_process';
import { rodarClaude } from './claude-cli.mjs';

const base = process.argv[2] ?? 'main';

const schema = {
  type: 'object',
  properties: {
    veredito: { type: 'string', enum: ['aprovado', 'ressalvas', 'reprovado'] },
    achados: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          arquivo: { type: 'string' },
          linha: { type: 'integer' },
          gravidade: { type: 'string', enum: ['alta', 'media', 'baixa'] },
          descricao: { type: 'string' },
        },
        required: ['arquivo', 'gravidade', 'descricao'],
      },
    },
  },
  required: ['veredito', 'achados'],
};

const diff = spawnSync('git', ['diff', `${base}...HEAD`], { encoding: 'utf8' });
if (diff.status !== 0) {
  console.error(`Não consegui comparar com "${base}". Confira o nome com: git branch\n${diff.stderr}`);
  process.exit(2);
}
if (!diff.stdout.trim()) {
  console.error(`Não há diferença commitada entre "${base}" e a branch atual. Crie uma branch, mude algo e faça commit.`);
  process.exit(2);
}

const r = rodarClaude([
  '-p', 'Revise o diff recebido no stdin contra CLAUDE.md e .claude/rules/. Reporte só problemas confirmados.',
  '--output-format', 'json',
  '--json-schema', JSON.stringify(schema),
  '--allowedTools', 'Read,Grep,Glob',
  '--permission-mode', 'dontAsk',
  '--max-budget-usd', '1',
], { input: diff.stdout, maxBuffer: 64 * 1024 * 1024 });

let resultado;
try { resultado = JSON.parse(r.stdout).structured_output; } catch { /* tratado abaixo */ }
if (!resultado) {
  console.error(`O Claude não devolveu a saída estruturada.\n${r.stdout ?? ''}${r.stderr ?? ''}`);
  process.exit(2);
}

console.log(JSON.stringify(resultado, null, 2));
const reprovado = resultado.veredito === 'reprovado';
console.log(`\ncódigo de saída: ${reprovado ? 1 : 0}`);
process.exit(reprovado ? 1 : 0);
