// Registra o servidor MCP da loja no Claude Code com o token de leitura ou de escrita do .env.
// Uso, a partir de labs/loja:  node scripts/registrar-mcp.mjs leitura     (ou: escrita)
// Existe para ninguém precisar carregar variáveis de ambiente à mão em cada terminal e sistema.
import { rodarClaude } from './claude-cli.mjs';
import { lerEnv } from './criar-env.mjs';

const papel = process.argv[2] ?? 'leitura';
if (!['leitura', 'escrita'].includes(papel)) {
  console.error('Uso: node scripts/registrar-mcp.mjs leitura   (ou: escrita)');
  process.exit(1);
}

const env = lerEnv();
const token = env[`MCP_TOKEN_${papel.toUpperCase()}`];
if (!token) {
  console.error('Não achei o token no .env. Rode antes: node scripts/criar-env.mjs');
  process.exit(1);
}

const url = `http://localhost:${env.PORT || 3000}/mcp`;
rodarClaude(['mcp', 'remove', 'loja-pedidos']); // tira o registro anterior, se houver

console.log('Comando executado (token escondido):');
console.log(`  claude mcp add --transport http loja-pedidos ${url} --header "Authorization: Bearer <token de ${papel}>"\n`);
const r = rodarClaude(['mcp', 'add', '--transport', 'http', 'loja-pedidos', url, '--header', `Authorization: Bearer ${token}`]);
process.stdout.write(`${r.stdout ?? ''}${r.stderr ?? ''}`);
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`\nRegistrado com o token de ${papel}. Confira com: claude mcp list   (a aplicação precisa estar no ar)`);
