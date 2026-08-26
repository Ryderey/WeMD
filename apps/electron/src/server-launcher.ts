import { app, utilityProcess, UtilityProcess } from 'electron';
import { spawn, exec, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

// 内嵌图床服务固定监听端口（避开常用端口冲突）
const EMBEDDED_SERVER_PORT = 14000;
const SERVER_START_TIMEOUT_MS = 30_000;
const SERVER_POLL_INTERVAL_MS = 500;

let devServerChild: ChildProcess | null = null;
let prodServerProcess: UtilityProcess | null = null;

export function getEmbeddedServerPort(): number {
    return EMBEDDED_SERVER_PORT;
}

// 探测本地端口是否已有服务在监听
export function isServerRunning(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 1000 }, (res) => {
            res.destroy();
            resolve(true);
        });
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        req.on('error', () => resolve(false));
    });
}

export async function waitForServer(
    port: number,
    timeoutMs = SERVER_START_TIMEOUT_MS,
    probe: (port: number) => Promise<boolean> = isServerRunning,
    pollIntervalMs = SERVER_POLL_INTERVAL_MS,
): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    if (await probe(port)) return true;
    while (Date.now() < deadline) {
        const remainingMs = deadline - Date.now();
        await new Promise((resolve) => setTimeout(resolve, Math.min(pollIntervalMs, remainingMs)));
        if (await probe(port)) return true;
    }
    return false;
}

// 解析 KEY=VALUE 格式的环境变量文件（忽略注释与空行）
function loadEnvFile(filePath: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!fs.existsSync(filePath)) return result;

    const content = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIndex = line.indexOf('=');
        if (eqIndex <= 0) continue;
        const key = line.slice(0, eqIndex).trim();
        let value = line.slice(eqIndex + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
            (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
        ) {
            value = value.slice(1, -1);
        }
        result[key] = value;
    }
    return result;
}

// 开发模式：从仓库根目录 spawn pnpm --filter @wemd/server dev
function startDevServer() {
    // 运行时 __dirname 为 apps/electron/dist，向上三级即仓库根目录
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    console.log(`[server-launcher] 开发模式，启动 Nest 图床服务（PORT=${EMBEDDED_SERVER_PORT}），cwd=${repoRoot}`);
    devServerChild = spawn('pnpm', ['--filter', '@wemd/server', 'dev'], {
        cwd: repoRoot,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: String(EMBEDDED_SERVER_PORT) },
    });
    devServerChild.on('exit', (code) => {
        console.log(`[server-launcher] Nest 开发服务已退出，code=${code}`);
        devServerChild = null;
    });
    devServerChild.on('error', (err) => {
        console.error('[server-launcher] 启动 Nest 开发服务失败:', err);
        devServerChild = null;
    });
}

// 打包模式：utilityProcess 运行随包部署的 Nest dist
function startProdServer() {
    const serverDir = path.join(process.resourcesPath, 'server');
    const entry = path.join(serverDir, 'dist', 'main.js');
    if (!fs.existsSync(entry)) {
        throw new Error(`未找到内嵌服务产物: ${entry}`);
    }

    // 微信图床凭据等环境变量来自用户数据目录的 server.env
    const envFile = path.join(app.getPath('userData'), 'server.env');
    const envFromFile = loadEnvFile(envFile);
    if (!fs.existsSync(envFile)) {
        console.warn(`[server-launcher] 未找到 ${envFile}，微信图床相关接口将不可用`);
    }

    prodServerProcess = utilityProcess.fork(entry, [], {
        cwd: serverDir,
        serviceName: 'wemd-nest-server',
        stdio: 'pipe',
        env: { ...process.env, ...envFromFile, PORT: String(EMBEDDED_SERVER_PORT) },
    });
    prodServerProcess.stdout?.on('data', (chunk: Buffer) => {
        process.stdout.write(`[nest-server] ${chunk}`);
    });
    prodServerProcess.stderr?.on('data', (chunk: Buffer) => {
        process.stderr.write(`[nest-server] ${chunk}`);
    });
    prodServerProcess.on('exit', (code) => {
        console.log(`[server-launcher] 内嵌 Nest 服务已退出，code=${code}`);
        prodServerProcess = null;
    });
    console.log(`[server-launcher] 打包模式，已启动内嵌 Nest 图床服务（PORT=${EMBEDDED_SERVER_PORT}）`);
}

// 若 14000 端口已有服务则复用，否则按运行模式启动内嵌服务
export async function startBundledServer(): Promise<void> {
    if (await isServerRunning(EMBEDDED_SERVER_PORT)) {
        console.log(`[server-launcher] 检测到 ${EMBEDDED_SERVER_PORT} 端口已有图床服务，直接复用，跳过启动`);
        return;
    }
    if (app.isPackaged) {
        startProdServer();
    } else {
        startDevServer();
    }
    if (!await waitForServer(EMBEDDED_SERVER_PORT)) {
        const mode = app.isPackaged ? '打包' : '开发';
        throw new Error(`${mode}模式下 Nest 服务未能在 ${SERVER_START_TIMEOUT_MS / 1000} 秒内监听 ${EMBEDDED_SERVER_PORT} 端口`);
    }
    console.log(`[server-launcher] Nest 服务已就绪（PORT=${EMBEDDED_SERVER_PORT}）`);
}

// 应用退出时终止由本进程拉起的服务
export function stopBundledServer() {
    if (devServerChild) {
        const child = devServerChild;
        devServerChild = null;
        if (process.platform === 'win32' && child.pid) {
            // shell spawn 会产生进程树，需要连同子进程一起终止
            exec(`taskkill /pid ${child.pid} /T /F`, (err) => {
                if (err) console.warn('[server-launcher] 终止 Nest 开发服务失败:', err.message);
            });
        } else {
            child.kill();
        }
    }
    if (prodServerProcess) {
        prodServerProcess.kill();
        prodServerProcess = null;
    }
}
