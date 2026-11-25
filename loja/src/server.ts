import { createMcpExpressApp, requireBearerAuth, type OAuthTokenVerifier } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { buildServer } from './mcp/build-server.ts';
import { buscarPedidos, ErroDeNegocio, obterPedido } from './services/pedidos.service.ts';

// Carrega o .env do projeto, se existir (igual em qualquer sistema). Variáveis já definidas no terminal têm prioridade.
try { process.loadEnvFile(); } catch { /* sem .env: segue com o ambiente do terminal */ }

const PORTA = Number(process.env.PORT ?? 3000);

// Tokens de laboratório vêm do ambiente (.env.example). Em produção: OAuth 2.1 + verificação de JWT.
const tokens = new Map<string, { clientId: string; scopes: string[] }>();
if (process.env.MCP_TOKEN_LEITURA) tokens.set(process.env.MCP_TOKEN_LEITURA, { clientId: 'atendimento', scopes: ['mcp', 'pedidos:leitura'] });
if (process.env.MCP_TOKEN_ESCRITA) tokens.set(process.env.MCP_TOKEN_ESCRITA, { clientId: 'supervisor', scopes: ['mcp', 'pedidos:leitura', 'pedidos:escrita'] });

const verifier: OAuthTokenVerifier = {
    verifyAccessToken: async token => {
        const dono = tokens.get(token);
        if (!dono) throw new Error('token inválido');
        return { token, clientId: dono.clientId, scopes: dono.scopes, expiresAt: Math.floor(Date.now() / 1000) + 3600 };
    }
};

const app = createMcpExpressApp();

app.get('/health', (_req, res) => void res.json({ ok: true }));

app.get('/api/pedidos', (req, res) => {
    res.json(buscarPedidos({ clienteEmail: req.query.clienteEmail as string | undefined }));
});

app.get('/api/pedidos/:id', (req, res) => {
    try {
        res.json(obterPedido(req.params.id));
    } catch (erro) {
        if (erro instanceof ErroDeNegocio) return void res.status(404).json({ codigo: erro.codigo, mensagem: erro.message });
        throw erro;
    }
});

// MCP Streamable HTTP, stateless: um McpServer novo por requisição, montado com as permissões de quem chamou.
const mcp = toNodeHandler(
    createMcpHandler(ctx => {
        const chamador = ctx.authInfo ? { clientId: ctx.authInfo.clientId, scopes: ctx.authInfo.scopes } : undefined;
        console.log(`[mcp] ${new Date().toISOString()} cliente=${chamador?.clientId ?? 'anon'}`);
        return buildServer(chamador);
    })
);
const auth = requireBearerAuth({ verifier, requiredScopes: ['mcp'] });
app.all('/mcp', auth, (req, res) => void mcp(req, res, req.body));

app.listen(PORTA, () => console.log(`loja: http://localhost:${PORTA}  (REST em /api, MCP em /mcp)`));
