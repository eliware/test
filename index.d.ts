export interface ParsedArguments {
  lint: boolean;
  runnerArguments: string[];
  help?: boolean;
  version?: boolean;
  ignoreCoverage?: boolean;
  sanitizeEnv?: boolean;
  runInBand?: boolean;
}

/** Parse wrapper flags and the Jest arguments delegated by the CLI. */
export function parseArguments(argumentsList?: readonly string[]): ParsedArguments;
export interface TextCoverageGap {
  file: string;
  metrics: string[];
}
export interface CoverageLocation {
  start?: { line?: number; column?: number };
  end?: { line?: number; column?: number };
  [key: string]: unknown;
}
export interface JsonCoverageGap {
  file: string;
  statements: CoverageLocation[];
  branches: CoverageLocation[];
  functions: Array<CoverageLocation & { name: string }>;
  lines: number[];
  metrics: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}
export type CoverageGap = TextCoverageGap | JsonCoverageGap;
/** Parse the Jest text coverage table and return files below 100×4. */
export function parseCoverage(text: string): TextCoverageGap[];
/** Format detailed coverage diagnostics for human-readable CLI output. */
export function formatCoverageGaps(gaps: CoverageGap[], root?: string): string;
/** Parse Istanbul JSON coverage and return actionable gaps. */
export function parseCoverageJson(json: Record<string, unknown>): JsonCoverageGap[];

// codescope ignore: collaborator results are intentionally partial because the runtime normalizes missing fields at the boundary.
export interface ProcessResult { code?: number; output?: string }
export interface ProcessOptions { cwd: string; inheritEnv: boolean }
export interface LintOptions {
  cwd: string; write: (message: string) => void; sanitizeEnv?: boolean;
  runLintCommand: (argumentsList: string[], options: ProcessOptions) => Promise<ProcessResult | null>;
  accessPath?: (path: string) => Promise<void>;
}
export interface ToolkitOptions {
  cwd: string; runnerArguments: string[]; write: (message: string) => void;
  runTest: (argumentsList: string[], options: ProcessOptions & { runInBand: boolean }) => Promise<ProcessResult | null>;
  runLintCommand: (argumentsList: string[], options: ProcessOptions) => Promise<ProcessResult | null>;
  runInBand?: boolean; ignoreCoverage?: boolean; sanitizeEnv?: boolean;
  accessPath?: (path: string) => Promise<void>;
  removePath?: (path: string, options: { force: boolean }) => Promise<void>;
  readFilePath?: (path: string, encoding: string) => Promise<string>;
}
/** Advanced orchestration API; consumers normally use the CLI. */
export function runLint(options: LintOptions): Promise<number>;
/** Advanced orchestration API; consumers normally use the CLI. */
export function runToolkit(options: ToolkitOptions): Promise<number>;
/** Find Istanbul ignore directives outside pure barrel modules. */
export function findIstanbulIgnoreViolations(cwd: string): Promise<Array<{ file: string; line: number }>>;
export const EXIT_CODES: Readonly<{
  WORKSPACE_SETUP: 2; ISTANBUL_POLICY: 3; INVALID_ARGUMENT: 4; FOCUSED_PATH_VALIDATION: 5;
  FOCUSED_PATH_MISSING: 6; COVERAGE_CLEANUP: 7; TEST_START: 8; TEST_FAILURE: 9;
  COVERAGE_FAILURE: 10; COVERAGE_GAP: 11; LINT_START: 12; LINT_FAILURE: 13; INTERNAL: 14;
}>;
