// Chama o Claude Code CLI do mesmo jeito no Windows, no macOS e no Linux.
import { spawnSync } from 'node:child_process';

export function rodarClaude(args, opcoes = {}) {
  const base = { encoding: 'utf8', ...opcoes };
  if (process.platform !== 'win32') return spawnSync('claude', args, base);

  // Windows: o instalador nativo cria claude.exe, que roda direto, sem passar por um shell.
  const achados = (spawnSync('where.exe', ['claude'], { encoding: 'utf8' }).stdout ?? '').split(/\r?\n/).filter(Boolean);
  const exe = achados.find(caminho => /\.exe$/i.test(caminho));
  if (exe) return spawnSync(exe, args, base);

  // Instalação antiga via npm (claude.cmd): precisa de shell, então argumentos com espaço vão entre aspas.
  const comAspas = args.map(a => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a));
  return spawnSync('claude', comAspas, { ...base, shell: true });
}
