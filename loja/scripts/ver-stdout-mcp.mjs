// Mostra o que um servidor MCP stdio escreve na saída padrão (stdout), que é o canal do protocolo.
// Uso, em labs/loja:  node scripts/ver-stdout-mcp.mjs [arquivo]     (padrão: src/mcp-qa/meu.ts)
//
// Inicia o servidor como o Claude Code faria, envia a primeira mensagem do protocolo (initialize) e
// classifica cada linha que volta: mensagem do protocolo (JSON) ou texto solto, que não deveria estar ali.
// Termina com código 1 se achar texto solto no stdout. Funciona igual em Windows, macOS e Linux.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const arquivo = process.argv[2] ?? 'src/mcp-qa/meu.ts';
if (!existsSync(arquivo)) {
  console.error(`Não achei ${arquivo}. Rode em labs/loja e passe o caminho do servidor.`);
  process.exit(2);
}

const servidor = spawn(process.execPath, ['--import', 'tsx', arquivo], { stdio: ['pipe', 'pipe', 'pipe'] });
const linhas = [];
let respondeu = false;

function ler(fluxo, canal) {
  let resto = '';
  fluxo.setEncoding('utf8');
  fluxo.on('data', pedaco => {
    const partes = (resto + pedaco).split(/\r?\n/);
    resto = partes.pop();
    for (const l of partes) registrar(canal, l);
  });
  fluxo.on('end', () => { if (resto) registrar(canal, resto); });
}

function registrar(canal, texto) {
  if (!texto.trim()) return;
  let protocolo = false;
  if (canal === 'stdout') {
    try { protocolo = JSON.parse(texto)?.jsonrpc === '2.0'; } catch { /* não é JSON */ }
    if (protocolo) respondeu = true;
  }
  linhas.push({ canal, protocolo, texto });
}

ler(servidor.stdout, 'stdout');
ler(servidor.stderr, 'stderr');

servidor.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'ver-stdout-mcp', version: '1.0.0' } },
}) + '\n');

// espera a resposta e mais um instante, para pegar o que o servidor escrever logo depois dela
const inicio = Date.now();
const espera = setInterval(() => {
  if ((respondeu && Date.now() - inicio > 1500) || Date.now() - inicio > 15000) { clearInterval(espera); servidor.kill(); }
}, 100);

servidor.on('error', e => { console.error(`Não consegui iniciar o servidor: ${e.message}`); process.exit(2); });
servidor.on('close', () => {
  clearInterval(espera);
  const cortar = t => (t.length > 96 ? t.slice(0, 96) + '…' : t);
  console.log(`\nO que ${arquivo} escreveu:\n`);
  for (const l of linhas) {
    const rotulo = l.canal === 'stderr' ? 'stderr · log, pode       '
      : l.protocolo ? 'stdout · protocolo (JSON)'
      : 'stdout · TEXTO SOLTO     ';
    console.log(`  ${rotulo}  ${cortar(l.texto)}`);
  }
  const soltas = linhas.filter(l => l.canal === 'stdout' && !l.protocolo).length;
  if (!respondeu) {
    console.log('\nO servidor não respondeu ao initialize. Confira os erros acima.');
    process.exit(2);
  }
  console.log(soltas
    ? `\n${soltas} linha(s) de texto solto no stdout, misturada(s) às mensagens do protocolo.\nO stdout é só do protocolo: troque console.log por console.error.`
    : '\nstdout limpo: só mensagens do protocolo. Os logs foram para o stderr.');
  process.exit(soltas ? 1 : 0);
});
