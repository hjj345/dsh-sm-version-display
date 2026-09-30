import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { alive, claim, writeJson, readJson, prepareRuntime, powerShellCommand, launchConsole, consoleStatus, validVirtualStore } from '../lib/update-runtime.mjs';

const root = mkdtempSync(join(tmpdir(), "DSH 中文 ' & $ test-"));
const project = fileURLToPath(new URL('..', import.meta.url));
const ps = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
const encode = (s) => Buffer.from(s, 'utf16le').toString('base64');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const children = [];
const run = (exe, args, options = {}) => new Promise((ok, fail) => {
  const child = spawn(exe, args, { windowsHide: true, ...options }); children.push(child);
  let output = '';
  child.stdout?.on('data', (x) => { output += x; }); child.stderr?.on('data', (x) => { output += x; });
  child.once('error', fail); child.once('close', (code) => ok({ code, output }));
});
try {
  const lock = join(root, 'test.lock'), release = claim(lock);
  assert.throws(() => claim(lock), /active/); release(); assert.equal(existsSync(lock), false);
  const expired=Number((await run(process.execPath,['-e','console.log(process.pid)'])).output.trim());
  writeJson(lock,{pid:expired});writeFileSync(lock+'.reclaim','');
  assert.throws(()=>claim(lock),/recovery is busy/);rmSync(lock+'.reclaim');
  const recovered=claim(lock);recovered();assert.equal(existsSync(lock),false);
  if (process.platform === 'win32') {
    const values = ["中文 a'b $value & 100%", 'tail\\'];
    assert.throws(()=>powerShellCommand(process.execPath,['']),/invalid command argument/);
    const source = powerShellCommand(process.execPath, ['-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', ...values]);
    for (const shell of [ps, 'pwsh.exe']) {
      const result = await run(shell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', encode(source)]);
      assert.equal(result.code, 0, result.output); assert.deepEqual(JSON.parse(result.output.trim()), values);
    }
  }
  const statePath = join(root, 'update-state.json');
  const globalRoot = join(root, 'global'), profileRoot = join(root, 'home/profiles/web');
  assert.equal(validVirtualStore(globalRoot,join(globalRoot,'node_modules/.pnpm')),true);
  assert.equal(validVirtualStore(globalRoot,join(globalRoot,'.pnpm')),true);
  assert.equal(validVirtualStore(globalRoot,join(root,'other/.pnpm')),false);
  mkdirSync(join(globalRoot,'node_modules'),{recursive:true});
  writeJson(join(globalRoot,'node_modules/.modules.yaml'),{virtualStoreDir:join(globalRoot,'node_modules/.pnpm')});
  const names = ['@deepseek-ai/dsh', '@deepseek-ai/dsh-settings', '@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'];
  for (const dir of [globalRoot, dirname(profileRoot), profileRoot]) {
    mkdirSync(dir, { recursive: true }); writeJson(join(dir, 'package.json'), { dependencies: Object.fromEntries(names.map((n) => [n, '0.0.1'])) });
  }
  writeFileSync(join(profileRoot, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n');
  const manager = join(root, 'manager/node_modules/pnpm/bin/pnpm.cjs'); mkdirSync(dirname(manager), { recursive: true });
  writeFileSync(manager, `const fs=require('fs'),p=require('path'),a=process.argv.slice(2);if(a[0]==='root'){console.log(${JSON.stringify(join(globalRoot, 'node_modules'))});}else if(a[0]==='view'){console.log(JSON.stringify('0.0.2'));}else if(a[0]==='install'){if(process.env.DSH_FIXTURE_FAIL){console.error('fixture failure');process.exit(9);}for(const r of ${JSON.stringify([globalRoot,dirname(profileRoot),profileRoot])})for(const n of ${JSON.stringify(names)}){const d=p.join(r,'node_modules',...n.split('/'));fs.mkdirSync(p.join(d,'lib'),{recursive:true});fs.writeFileSync(p.join(d,'package.json'),JSON.stringify({name:n,version:'0.0.2',bin:{dsh:'lib/bin.js'}}));fs.writeFileSync(p.join(d,'lib/bin.js'),'console.log("profile verified");');}console.log('fixture install output');}else process.exit(3);`);
  const makeState = (id) => ({ id, version: '0.0.2', previousVersion:'0.0.1', status:'needs-offline-repair', globalRoot, profileRoot, backup:{status:'skipped'}, backupOptions:{enabled:false}, method:'pnpm', steps:['repair','install','profile-repair','verify'].map((id)=>({id,status:'pending'})), lines:[] });
  const env = {...process.env,PATH:join(root,'manager')+';'+process.env.PATH};
  const worker = join(project,'lib/update-worker.mjs');
  const workerArgs = (id) => [worker,'--state',statePath,'--job',id,'--action','offline-repair','--console'];
  writeJson(statePath,makeState('success'));
  const result = await run(process.execPath,workerArgs('success'),{env});
  assert.equal(result.code,0,result.output); assert.equal(readJson(statePath).status,'restart-required');
  assert.ok(readJson(statePath).steps.every((s)=>s.status==='success'));
  assert.match(result.output,/fixture install output/); assert.match(result.output,/profile verified/);
  assert.match(readFileSync(readJson(statePath).logPath,'utf8'),/\[command\]/);
  writeJson(statePath,makeState('failure'));
  const bad=await run(process.execPath,workerArgs('failure'),{env:{...env,DSH_FIXTURE_FAIL:'1'}});
  assert.notEqual(bad.code,0); assert.equal(readJson(statePath).status,'error'); assert.match(bad.output,/fixture failure/);
  assert.equal((await run(process.execPath,workerArgs('wrong'),{env})).code,4);
  assert.equal(readJson(statePath).id,'failure');
  writeJson(statePath,{...makeState('host-live'),hostPid:process.pid});
  const busy=await run(process.execPath,workerArgs('host-live'),{env});
  assert.notEqual(busy.code,0); assert.match(busy.output,/DSH is still running/);
  if(process.argv.includes('--visible')){
    const id='visible',runtimeDir=prepareRuntime(statePath,id);
    // No real package installation: this worker only emits output and updates fixture state.
    writeFileSync(join(runtimeDir,'update-worker.mjs'),`import{readFileSync,writeFileSync}from'node:fs';const a=process.argv.slice(2),f=a[a.indexOf('--state')+1];console.log('VISIBLE_FIXTURE: command started');setTimeout(()=>{console.log('VISIBLE_FIXTURE: live output');const s=JSON.parse(readFileSync(f));writeFileSync(f,JSON.stringify({...s,status:'restart-required',steps:[]}));},500);`);
    const host=spawn(process.execPath,['-e','setTimeout(()=>{},8000)'],{windowsHide:true,stdio:'ignore'});children.push(host);
    const state={...makeState(id),runtimeDir,hostPid:host.pid,autoContinue:true}; writeJson(statePath,state);
    const ready=await launchConsole(statePath,state); assert.equal(ready.nativeConsole,true);
    assert.equal(ready.nativeInput,true);
    assert.equal(readJson(statePath).status,'needs-offline-repair');
    let final; for(let i=0;i<100;i++){final=consoleStatus(state);if(['complete','error'].includes(final?.status))break;await wait(250);}
    if(alive(ready.shellPid))spawnSync(join(process.env.SystemRoot,'System32/taskkill.exe'),['/PID',String(ready.shellPid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
    assert.equal(final?.status,'complete',final?.error);
    console.log('Visible console: native handles, readiness, host exit survival and completion passed.');
    const nextId='closed-display',nextDir=prepareRuntime(statePath,nextId);
    const nextHost=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});children.push(nextHost);
    const nextState={...makeState(nextId),runtimeDir:nextDir,hostPid:nextHost.pid,autoContinue:true};writeJson(statePath,nextState);
    const oldPath=process.env.PATH;let nextReady;
    try {process.env.PATH=env.PATH;nextReady=await launchConsole(statePath,nextState);} finally {process.env.PATH=oldPath;}
    nextHost.kill();
    for(let i=0;i<100 && readJson(statePath)?.status!=='running';i++)await wait(100);
    assert.equal(readJson(statePath).status,'running');
    // Only kill this test's display processes, not the detached worker or its manager.
    process.kill(nextReady.pid);
    if(alive(nextReady.shellPid))spawnSync(join(process.env.SystemRoot,'System32/taskkill.exe'),['/PID',String(nextReady.shellPid),'/F'],{windowsHide:true,stdio:'ignore'});
    for(let i=0;i<200 && readJson(statePath)?.status==='running';i++)await wait(100);
    assert.equal(readJson(statePath).status,'restart-required',readJson(statePath)?.error);
    console.log('Closing the fixture display during real Worker execution preserves installation and persisted completion.');
  }
  console.log('Update console checks passed: PowerShell quoting, lock, real worker/fake manager, failure, host guard, job binding and logs.');
} finally {
  for(const child of children)if(alive(child.pid))child.kill();
  rmSync(root,{recursive:true,force:true});
}
