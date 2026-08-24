export interface ParsedArguments {
  lint: boolean;
  runnerArguments: string[];
}

export function parseArguments(argumentsList?: readonly string[]): ParsedArguments;
export interface CoverageGap { file: string; metrics: string[]; }
export function parseCoverage(text: string): CoverageGap[];
export function formatCoverageGaps(gaps: CoverageGap[]): string;
export function parseCoverageJson(json: Record<string, unknown>): CoverageGap[];
