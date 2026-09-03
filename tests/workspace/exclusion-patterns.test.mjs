import { STANDARD_EXCLUSIONS, oxlintExclusionArguments } from '../../src/workspace/exclusion-patterns.mjs';

test('defines standard exclusions and Oxlint arguments', () => {
  expect(STANDARD_EXCLUSIONS).toContain('coverage');
  expect(oxlintExclusionArguments()).toContain('--ignore-pattern');
  expect(oxlintExclusionArguments()).toContain('node_modules');
});

test('defines the complete Oxlint workspace exclusion contract', () => {
  expect(STANDARD_EXCLUSIONS).toEqual([
    '.git', 'node_modules', 'coverage', '.nyc_output', 'test-results',
    'dist', 'build', '*.tgz'
  ]);
  expect(oxlintExclusionArguments()).toEqual(
    STANDARD_EXCLUSIONS.flatMap((pattern) => ['--ignore-pattern', pattern])
  );
});
