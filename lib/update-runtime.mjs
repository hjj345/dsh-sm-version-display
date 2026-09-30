import { copyFileSync, mkdirSync, openSync, closeSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

export const readJson = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; } };
export function validVirtualStore(root, store) {
  if (store === undefined) return true;
  if (!root) return false;
  const normalize = (p) => {
    const value = p.replaceAll('\\', '/').replace(/\/$/, '');
    return process.platform === 'win32' ? value.toLowerCase() : value;
  };
  return [join(root, '.pnpm'), join(root, 'node_modules', '.pnpm')].some((p) => normalize(p) === normalize(store));
}
export function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code !== 'ESRCH'; }
}
export function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = path + '.' + process.pid + '-' + randomBytes(6).toString('hex') + '.tmp';
  try {
    writeFileSync(temp, JSON.stringify(data), 'utf8');
    for (let i = 0; ; i++) {
      try { renameSync(temp, path); break; }
      catch (e) {
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(e.code) || i === 5) throw e;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
      }
    }
  } finally { rmSync(temp, { force: true }); }
}
export function claim(path) {
  mkdirSync(dirname(path), { recursive: true });
  for (let i = 0; i < 2; i++) {
    try {
      const fd = openSync(path, 'wx');
      try { writeFileSync(fd, JSON.stringify({ pid: process.pid })); } finally { closeSync(fd); }
      return () => { if (readJson(path)?.pid === process.pid) rmSync(path, { force: true }); };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const owner = readJson(path);
      // A new lock can be partially written: never steal it.
      if (!owner || alive(owner.pid)) throw new Error('another update process is active');
      let guard;
      try { guard = openSync(path + '.reclaim', 'wx'); }
      catch (e) { if (e.code === 'EEXIST') throw new Error('update lock recovery is busy'); throw e; }
      try {
        const current = readJson(path);
        if (current && !alive(current.pid)) rmSync(path, { force: true });
        else if (current) throw new Error('another update process is active');
      } finally { closeSync(guard); rmSync(path + '.reclaim', { force: true }); }
    }
  }
  throw new Error('could not acquire update lock');
}
export function prepareRuntime(statePath, id) {
  if (!/^[a-z0-9_-]+$/i.test(id)) throw new Error('invalid update job ID');
  const target = join(dirname(statePath), 'jobs', id);
  mkdirSync(target, { recursive: true });
  for (const file of ['update-worker.mjs', 'backup-manager.mjs', 'update-runtime.mjs', 'update-console.ps1']) copyFileSync(fileURLToPath(new URL('./' + file, import.meta.url)), join(target, file));
  return target;
}
export const quotePowerShell = (value) => "'" + String(value).replaceAll("'", "''") + "'";
export const powerShellCommand = (exe, args) => {
  if ([exe, ...args].some((value) => typeof value !== 'string' || !value || /[\r\n\0]/.test(value))) throw new Error('invalid command argument');
  return '& ' + [exe, ...args].map(quotePowerShell).join(' ');
};
export const consoleStatePath = (state) => state.runtimeDir ? join(state.runtimeDir, 'console-state.json') : null;
export function consoleStatus(state) {
  const status = readJson(consoleStatePath(state) ?? '');
  return status?.jobId === state.id ? status : null;
}
export function jobBusy(state) {
  if (!state) return false;
  const status = consoleStatus(state);
  return state.status === 'running' || (['waiting', 'running'].includes(status?.status) && alive(status.pid)) || (state.status === 'needs-offline-repair' && (state.autoContinue === true || state.consoleLaunching === true || alive(state.workerPid)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const encode = (text) => Buffer.from(text, 'utf16le').toString('base64');
export async function launchConsole(statePath, state) {
  if (process.platform !== 'win32') throw new Error('automatic update console requires Windows');
  const payload = `& ${quotePowerShell(join(state.runtimeDir, 'update-console.ps1'))} -NodeExecutable ${quotePowerShell(process.execPath)} -RuntimeScript ${quotePowerShell(join(state.runtimeDir, 'update-runtime.mjs'))} -StatePath ${quotePowerShell(statePath)} -JobId ${quotePowerShell(state.id)}`;
  // Only the bootstrap is hidden; Start-Process gives the visible window its own console handles.
  const bootstrap = `Start-Process -FilePath 'powershell.exe' -WindowStyle Normal -ArgumentList @('-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${encode(payload)}') -PassThru | Out-Null`;
  const ps = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  await new Promise((ok, fail) => {
    const child = spawn(ps, ['-NoProfile', '-NonInteractive', '-EncodedCommand', encode(bootstrap)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let errors = '';
    child.stderr.on('data', (data) => { errors += data; });
    const timer = setTimeout(() => { child.kill(); fail(new Error('console launcher timed out')); }, 10000);
    child.once('error', (e) => { clearTimeout(timer); fail(e); });
    child.once('close', (code) => { clearTimeout(timer); code === 0 ? ok() : fail(new Error('console launcher failed: ' + errors)); });
  });
  for (let i = 0; i < 40; i++) {
    const status = consoleStatus(state);
    if (status?.status === 'waiting' && alive(status.pid)) return status;
    if (status?.status === 'error') throw new Error(status.error);
    await sleep(250);
  }
  throw new Error('update console did not acknowledge readiness');
}
export async function runConsole(statePath, jobId) {
  let state = readJson(statePath);
  if (!state || state.id !== jobId || !state.runtimeDir) throw new Error('update job changed or is invalid');
  const release = claim(join(state.runtimeDir, 'console.lock'));
  const sidecar = consoleStatePath(state);
  const report = (status, error) => writeJson(sidecar, { jobId, pid: process.pid, shellPid: process.ppid, nativeConsole: !!process.stdout.isTTY, nativeInput: !!process.stdin.isTTY, status, error, lastActivityAt: Date.now() });
  let timer;
  try {
    report('waiting');
    console.log('DSH update ' + state.version + '\n' + (state.backup?.status === 'skipped' ? 'Backup was explicitly skipped.' : 'Backup: ' + state.backup?.root));
    console.log('Close DSH. Update continues automatically. Do not restart until completion.');
    timer = setInterval(() => report('waiting'), 2000);
    const deadline = Date.now() + 45 * 60 * 1000;
    while (alive(state.hostPid) || alive(state.workerPid)) {
      if (Date.now() >= deadline) throw new Error('waiting for DSH timed out');
      await sleep(500);
      if (readJson(statePath)?.id !== jobId) throw new Error('update job changed; cancelled');
      const host = readJson(join(state.runtimeDir, 'observed-host.json'));
      if (host?.pid !== state.hostPid && alive(host?.pid)) throw new Error('DSH restarted before repair; close it and retry');
    }
    clearInterval(timer);
    const current = readJson(statePath);
    if (current?.id !== jobId || current.status !== 'needs-offline-repair' || !current.autoContinue) throw new Error('update is no longer armed');
    state = current;
    if (alive(readJson(join(state.runtimeDir, 'observed-host.json'))?.pid)) throw new Error('DSH is running; close it before repair');
    report('running');
    timer = setInterval(() => report('running'), 2000);
    const workerArgs = [join(state.runtimeDir, 'update-worker.mjs'), '--state', statePath, '--job', jobId, '--action', 'offline-repair', '--console'];
    console.log(powerShellCommand(process.execPath, workerArgs));
    const code = await new Promise((ok, fail) => {
      // Closing the display window must not terminate an in-progress dependency installation.
      const child = spawn(process.execPath, workerArgs, { detached: true, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
      child.stdout.on('data', (data) => process.stdout.write(data));
      child.stderr.on('data', (data) => process.stderr.write(data));
      child.once('error', fail);
      child.once('close', (code) => ok(code));
    });
    const final = readJson(statePath);
    if (code !== 0 || final?.id !== jobId || final.status !== 'restart-required') throw new Error(final?.error ?? 'worker did not complete verification');
    report('complete');
    console.log('\n更新与离线校验已通过，现在可以启动 DSH。\n启动后请在插件页面执行最终验证。');
    return 0;
  } catch (error) {
    report('error', error.message);
    console.error('\n更新已停止：' + error.message + '\n尚未确认环境可启动，请先排查失败原因。\n完整日志：' + (state.logPath ?? 'see update state directory'));
    return 1;
  } finally { clearInterval(timer); release(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  try { process.exitCode = await runConsole(args[args.indexOf('--state') + 1], args[args.indexOf('--job') + 1]); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
