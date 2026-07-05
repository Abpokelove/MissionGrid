import { spawn } from 'node:child_process';

const processes = [
  { name: 'server', command: 'npm', args: ['--prefix', 'server', 'run', 'dev'] },
  { name: 'client', command: 'npm', args: ['--prefix', 'client', 'run', 'dev'] },
];

let shuttingDown = false;
const children = [];

const prefix = (name, chunk) => {
  const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
  lines.forEach((line) => console.log(`[${name}] ${line}`));
};

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
  setTimeout(() => process.exit(code), 150);
};

for (const proc of processes) {
  const child = spawn(proc.command, proc.args, {
    cwd: process.cwd(),
    shell: true,
    env: process.env,
  });

  children.push(child);
  child.stdout.on('data', (chunk) => prefix(proc.name, chunk));
  child.stderr.on('data', (chunk) => prefix(proc.name, chunk));
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${proc.name}] exited with code ${code}`);
      shutdown(code || 1);
    }
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
