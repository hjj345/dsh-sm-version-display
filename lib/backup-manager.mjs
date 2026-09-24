import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';

const read = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; } };
const inside = (child, parent) => { const rel = relative(parent, child); return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel)); };
function canonical(path) {
  const absolute = resolve(path);
  if (existsSync(absolute)) return realpathSync(absolute);
  const parent = dirname(absolute);
  if (parent === absolute) throw new Error('directory-unavailable');
  return join(canonical(parent), basename(absolute));
}
function catalog(stateDir) { return read(join(stateDir, 'backup-index.json')) ?? { roots: [], entries: [] }; }
function save(stateDir, data) {
  mkdirSync(stateDir, { recursive: true });
  const path = join(stateDir, 'backup-index.json');
  const temporary = path + '.' + randomBytes(8).toString('hex') + '.tmp';
  try { writeFileSync(temporary, JSON.stringify(data)); renameSync(temporary, path); }
  finally { rmSync(temporary, { force: true }); }
}
export function validateBackupDirectory(directory, sources = []) {
  if (typeof directory !== 'string' || !isAbsolute(directory) || /[\r\n\0]/.test(directory)) throw new Error('invalid-backup-directory');
  const target = canonical(directory);
  for (let ancestor = target; ; ancestor = dirname(ancestor)) {
    if (/^\d{13}-[a-f\d]{24}(?:-[a-f\d]+)?$/.test(basename(ancestor)) || read(join(ancestor, 'manifest.json'))?.backup?.root === ancestor) throw new Error('backup-directory-inside-backup');
    if (dirname(ancestor) === ancestor) break;
  }
  for (const source of sources.filter(Boolean)) {
    const origin = canonical(source);
    if (inside(target, origin) || inside(origin, target)) throw new Error('backup-directory-overlaps-source');
  }
  mkdirSync(target, { recursive: true });
  const probe = join(target, '.dsh-write-test-' + randomBytes(8).toString('hex'));
  try { writeFileSync(probe, '', { flag: 'wx' }); } finally { rmSync(probe, { force: true }); }
  return target;
}
export function registerBackup(stateDir, entry) {
  const data = catalog(stateDir);
  const root = dirname(entry.path);
  data.roots = [...new Set([...(data.roots ?? []), root])];
  data.entries = [...(data.entries ?? []).filter(item => item.path !== entry.path), entry];
  save(stateDir, data);
}
export function rememberBackupDirectory(stateDir, directory) {
  const data = catalog(stateDir);
  data.directory = directory;
  data.roots = [...new Set([...(data.roots ?? []), directory])];
  save(stateDir, data);
}
export function isBackupComplete(backup, jobId) {
  if (backup?.status !== 'complete' || !backup.root) return false;
  try { if (lstatSync(backup.root).isSymbolicLink()) return false; } catch { return false; }
  const manifest = read(join(backup.root, 'manifest.json'));
  if (manifest?.backup?.status !== 'complete' || manifest.backup.root !== backup.root || !manifest.state?.id || (jobId && manifest.state.id !== jobId)) return false;
  return ['global', 'dsh'].every(key => {
    const path = backup[key];
    try { return path && manifest.backup[key] === path && inside(canonical(path), canonical(backup.root)) && path !== backup.root && !lstatSync(path).isSymbolicLink() && lstatSync(path).isDirectory(); }
    catch { return false; }
  });
}
async function measure(path) {
  let sizeBytes = 0, fileCount = 0;
  for (const item of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, item.name), stat = lstatSync(child);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) { const size = await measure(child); sizeBytes += size.sizeBytes; fileCount += size.fileCount; }
    else { sizeBytes += stat.size; fileCount++; }
  }
  await new Promise(resolve => setImmediate(resolve));
  return { sizeBytes, fileCount };
}
export function backupDirectories(stateDir) { const data = catalog(stateDir); return { directory: data.directory ?? join(stateDir, 'backups'), defaultDirectory: join(stateDir, 'backups') }; }
export async function listBackups(stateDir, state) {
  const data = catalog(stateDir), defaultDirectory = join(stateDir, 'backups');
  const roots = [...new Set([defaultDirectory, ...(data.roots ?? [])])];
  const paths = new Map((data.entries ?? []).map(entry => [entry.path, entry]));
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const item of readdirSync(root, { withFileTypes: true })) {
      if (!item.isDirectory() || item.isSymbolicLink()) continue;
      const path = join(root, item.name), manifest = read(join(path, 'manifest.json'));
      if (/^\d{13}-[a-f\d]{24}(?:-[a-f\d]+)?$/.test(item.name) && (root === defaultDirectory || (manifest?.state?.id && manifest?.backup?.root === path))) paths.set(path, paths.get(path) ?? {});
    }
  }
  const backups = [];
  for (const [path, entry] of paths) {
    try {
      if (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory()) continue;
      const manifest = read(join(path, 'manifest.json'));
      const active = state?.backup?.root === path;
      const backup = active ? state.backup : manifest?.backup;
      const inUse = active && state.status === 'running';
      const savedSize = entry.sizeBytes ?? backup?.copiedBytes ?? backup?.bytes ?? manifest?.backup?.bytes;
      const savedFiles = entry.fileCount ?? backup?.completedFiles ?? backup?.files ?? manifest?.backup?.files;
      const size = Number.isSafeInteger(savedSize) && savedSize >= 0 && Number.isSafeInteger(savedFiles) && savedFiles >= 0
        ? { sizeBytes: savedSize, fileCount: savedFiles }
        : await measure(path);
      backups.push({ ...entry, id: path, path, createdAt: entry.createdAt ?? backup?.createdAt ?? (Number(basename(path).split('-')[0]) || lstatSync(path).birthtimeMs),
        previousVersion: entry.previousVersion ?? manifest?.state?.previousVersion, version: entry.version ?? manifest?.state?.version,
        status: isBackupComplete(backup) ? 'complete' : active && state.status === 'running' ? 'running' : backup?.status === 'failed' || backup?.status === 'error' ? 'failed' : 'incomplete', inUse, ...size });
    } catch (error) { backups.push({ id: path, path, status: 'unavailable', inUse: true, error: error.message, sizeBytes: null }); }
  }
  return { backups: backups.sort((a,b) => b.createdAt - a.createdAt), directory: data.directory ?? defaultDirectory, defaultDirectory };
}
export async function deleteBackups(stateDir, ids, state) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 || ids.some(id => typeof id !== 'string')) throw new Error('invalid-backup-selection');
  if (state?.status === 'running') throw new Error('already-running');
  const known = new Map((await listBackups(stateDir, state)).backups.map(item => [item.id, item]));
  const deleted = [], errors = [];
  for (const id of new Set(ids)) {
    try {
      const item = known.get(id);
      if (!item || item.inUse || lstatSync(item.path).isSymbolicLink()) throw new Error('backup-protected-or-unknown');
      // Only discovered plugin-owned children are removable; fs.rm does not follow junctions inside them.
      if (canonical(item.path) !== resolve(item.path)) throw new Error('backup-path-changed');
      rmSync(item.path, { recursive: true });
      deleted.push(id);
    } catch (error) { errors.push({ id, error: error.message }); }
  }
  const data = catalog(stateDir);
  data.entries = (data.entries ?? []).filter(item => !deleted.includes(item.path));
  save(stateDir, data);
  return { deleted, errors };
}
export function browseDirectories(path) {
  if (typeof path !== 'string' || !isAbsolute(path)) throw new Error('invalid-directory');
  const current = realpathSync(path);
  return { path: current, parent: dirname(current) === current ? null : dirname(current), directories: readdirSync(current, { withFileTypes: true }).filter(item => item.isDirectory() && !item.isSymbolicLink()).map(item => ({ name: item.name, path: join(current, item.name) })).sort((a,b) => a.name.localeCompare(b.name)) };
}
