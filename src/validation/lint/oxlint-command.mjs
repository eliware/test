import { oxlintExclusionArguments } from '../../workspace/exclusion-patterns.mjs';

export function buildOxlintArguments() {
  return ['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()];
}
