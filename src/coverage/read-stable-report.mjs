export async function readStableReport(reportPath, readFilePath, statPath, startedAt) {
  let before = null;
  if (startedAt) {
    try { before = await statPath(reportPath); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const first = await readFilePath(reportPath, 'utf8');
  let firstAfter = null;
  let second = first;
  let after = null;
  if (startedAt) {
    try {
      firstAfter = await statPath(reportPath);
      second = await readFilePath(reportPath, 'utf8');
      after = await statPath(reportPath);
    } catch (error) {
      if (error.code === 'ENOENT') return { contents: first, fresh: false, freshnessAvailable: firstAfter !== null };
      throw error;
    }
  }
  const identityChanged = firstAfter && after && firstAfter.dev !== undefined && after.dev !== undefined
    && firstAfter.ino !== undefined && after.ino !== undefined
    && (firstAfter.dev !== after.dev || firstAfter.ino !== after.ino);
  if (startedAt && (first !== second || (firstAfter && after && firstAfter.mtimeMs !== after.mtimeMs) || identityChanged)) return null;
  const hasTimes = firstAfter?.mtimeMs !== undefined && after?.mtimeMs !== undefined;
  const fresh = !startedAt || (hasTimes && (before ? firstAfter.mtimeMs === after.mtimeMs && after.mtimeMs >= startedAt : after.mtimeMs >= startedAt));
  return { contents: second, fresh, freshnessAvailable: !startedAt || hasTimes };
}
