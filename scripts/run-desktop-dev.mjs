import { spawn } from 'child_process';
import http from 'http';

function run(command, args, env = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  });
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Command ${command} ${args.join(' ')} exited with code ${code}`);
      process.exit(code ?? 1);
    }
  });
  return child;
}

run('pnpm', ['dev:web']);

function checkServer(url, onReady) {
  const request = http.get(url, (res) => {
    res.destroy();
    onReady();
  });
  request.on('error', () => {
    setTimeout(() => checkServer(url, onReady), 1000);
  });
}

checkServer('http://localhost:5173', () => {
  // 直接以 spawn env 注入环境变量启动 Electron，
  // 避免 root script 中的 Unix 风格内联 env 赋值在 Windows cmd 下不可用
  run('pnpm', ['--filter', 'wemd-electron', 'run', 'dev', '--', '--dev'], {
    ELECTRON_START_URL: 'http://localhost:5173',
    NODE_ENV: 'development',
  });
});
