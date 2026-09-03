import { STANDARD_EXCLUSIONS, oxlintExclusionArguments } from '../../../src/workspace/discovery/exclusions.mjs';
test('defines standard exclusions and Oxlint arguments', () => { expect(STANDARD_EXCLUSIONS).toContain('coverage'); expect(oxlintExclusionArguments()).toContain('--ignore-pattern'); });
