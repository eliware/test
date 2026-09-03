import { EXIT_CODES } from '../../exit-codes.mjs';
import { formatFailure } from '../diagnostics.mjs';
export async function runPackageStages(context) {
  for (const [label, command, code] of [['Audit', context.runAudit, EXIT_CODES.AUDIT_FAILURE], ['Pack', context.runPack, EXIT_CODES.PACK_FAILURE]]) {
    if (!command) continue;
    let result;
    try { result = (await command(label === 'Audit' ? ['audit', '--omit=dev', '--audit-level=moderate', '--ignore-scripts'] : ['pack', '--dry-run', '--ignore-scripts'], { cwd: context.cwd, inheritEnv: !context.sanitizeEnv })) ?? {}; } catch (error) { context.write(`${label} failed to start: ${error.message}\n`); return code; }
    const normalized = { ...result, output: typeof result.output === 'string' ? result.output : '', code: Number.isInteger(result.code) ? result.code : 1 };
    if (normalized.code !== 0) { context.write(formatFailure(label, normalized)); return code; }
  }
  return 0;
}
