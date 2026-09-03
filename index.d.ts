export interface ParsedArguments {
  lint: boolean;
  runnerArguments: string[];
  help?: boolean;
  version?: boolean;
  ignoreCoverage?: boolean;
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

/** Advanced orchestration API; consumers normally use the CLI. This seam is versioned with the package. */
export function runLint(options: { cwd: string; write: (message: string) => void; runLintCommand: (argumentsList: string[], options: { cwd: string }) => Promise<{ code?: number; output?: string } | null>; accessPath?: (path: string) => Promise<void> }): Promise<number>;
/** Advanced orchestration API; collaborators are injected for composition/testing. */
export function runToolkit(options: { cwd: string; runnerArguments: string[]; write: (message: string) => void; runTest: (argumentsList: string[], options: { cwd: string; runInBand: boolean }) => Promise<{ code?: number; output?: string } | null>; runLintCommand: (argumentsList: string[], options: { cwd: string }) => Promise<{ code?: number; output?: string } | null>; runInBand?: boolean; ignoreCoverage?: boolean; accessPath?: (path: string) => Promise<void>; removePath?: (path: string, options: { force: boolean }) => Promise<void>; readFilePath?: (path: string, encoding: string) => Promise<string> }): Promise<number>;
/** Find Istanbul ignore directives outside pure barrel modules. */
export function findIstanbulIgnoreViolations(cwd: string): Promise<Array<{ file: string; line: number }>>;
export const EXIT_CODES: Readonly<{
  WORKSPACE_SETUP: 2; ISTANBUL_POLICY: 3; INVALID_ARGUMENT: 4; FOCUSED_PATH_VALIDATION: 5;
  FOCUSED_PATH_MISSING: 6; COVERAGE_CLEANUP: 7; TEST_START: 8; TEST_FAILURE: 9;
  COVERAGE_FAILURE: 10; COVERAGE_GAP: 11; LINT_START: 12; LINT_FAILURE: 13; INTERNAL: 14;
}>;
