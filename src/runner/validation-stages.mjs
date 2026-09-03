import { EXIT_CODES } from '../exit-codes.mjs';
import { formatFailure, hasLintWarnings } from './diagnostics.mjs';
import { oxlintExclusionArguments } from '../workspace.mjs';

export async function runBuildStage(context, buildScript) {
  if (!buildScript || !context.runBuild) return 0;
  let result;
  try { result = (await context.runBuild(['run', 'build'], { cwd: context.cwd, inheritEnv: !context.sanitizeEnv })) ?? {}; }
  catch (error) { context.write(`Build failed to start: ${error.message}\n`); return EXIT_CODES.BUILD_FAILURE; }
  const normalized = normalizeResult(result);
  if (normalized.code !== 0) context.write(formatFailure('Build', normalized));
  return normalized.code === 0 ? 0 : EXIT_CODES.BUILD_FAILURE;
}

export async function runLintStage(context) {
  let result;
  try { result = (await context.runLintCommand(['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()], { cwd: context.cwd, inheritEnv: !context.sanitizeEnv })) ?? {}; }
  catch (error) { context.write(`Lint failed to start: ${error.message}\n`); return EXIT_CODES.LINT_START; }
  const normalized = normalizeResult(result);
  if (normalized.code !== 0 || hasLintWarnings(normalized.output)) {
    context.write(formatFailure('Lint', normalized));
    return EXIT_CODES.LINT_FAILURE;
  }
  return 0;
}

export async function runPackageStages(context) {
  for (const [label, command, code] of [['Audit', context.runAudit, EXIT_CODES.AUDIT_FAILURE], ['Pack', context.runPack, EXIT_CODES.PACK_FAILURE]]) {
    if (!command) continue;
    let result;
    try { result = (await command(label === 'Audit' ? ['audit', '--omit=dev', '--audit-level=moderate', '--ignore-scripts'] : ['pack', '--dry-run', '--ignore-scripts'], { cwd: context.cwd, inheritEnv: !context.sanitizeEnv })) ?? {}; }
    catch (error) { context.write(`${label} failed to start: ${error.message}\n`); return code; }
    const normalized = normalizeResult(result);
    if (normalized.code !== 0) { context.write(formatFailure(label, normalized)); return code; }
  }
  return 0;
}

function normalizeResult(result) {
  return { ...result, output: typeof result.output === 'string' ? result.output : '', code: Number.isInteger(result.code) ? result.code : 1 };
}
