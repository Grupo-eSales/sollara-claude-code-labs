// Cria o .env do laboratório com dois tokens aleatórios. Não imprime os tokens.
// Uso, a partir de labs/loja:  node scripts/criar-env.mjs
// Se o .env já existir com os dois tokens preenchidos, não muda nada.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projeto = join(dirname(fileURLToPath(import.meta.url)), '..');
const arquivo = join(projeto, '.env');

export function lerEnv() {
  if (!existsSync(arquivo)) return {};
  const pares = readFileSync(arquivo, 'utf8').split(/\r?\n/)
    .map(linha => linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map(([, chave, valor]) => [chave, valor]);
  return Object.fromEntries(pares);
}

export function criarEnv() {
  const atual = lerEnv();
  if (atual.MCP_TOKEN_LEITURA && atual.MCP_TOKEN_ESCRITA) return 'já existia';
  const token = () => randomBytes(16).toString('hex');
  writeFileSync(arquivo, [
    '# Tokens de laboratório, gerados por scripts/criar-env.mjs. Não versionar e não colar no chat.',
    `PORT=${atual.PORT || 3000}`,
    `MCP_TOKEN_LEITURA=${atual.MCP_TOKEN_LEITURA || token()}`,
    `MCP_TOKEN_ESCRITA=${atual.MCP_TOKEN_ESCRITA || token()}`,
    '',
  ].join('\n'));
  return 'criado';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(criarEnv() === 'criado'
    ? '.env criado com um token de leitura e um de escrita (valores diferentes).'
    : '.env já tinha os dois tokens: nada foi alterado.');
}
