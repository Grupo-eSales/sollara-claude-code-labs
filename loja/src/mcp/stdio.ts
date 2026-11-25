import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { buildServer } from './build-server.ts';

// Em stdio o stdout é o canal do protocolo: logs SEMPRE em stderr.
const server = buildServer();
await server.connect(new StdioServerTransport());
console.error('[loja-pedidos] MCP stdio pronto');
