import { hasTextCoverageEvidence } from '../../src/coverage/text-evidence.mjs';
test('detects complete text coverage evidence', () => expect(hasTextCoverageEvidence('File | % Stmts | % Branch | % Funcs | % Lines |\na | 100% | 100% | 100% | 100% |')).toBe(true));
test('rejects lookalike partial tables', () => expect(hasTextCoverageEvidence('File | % Stmts | % Branch |\na | 100% | 100% |')).toBe(false));
test('rejects missing or truncated output', () => {
  expect(hasTextCoverageEvidence(null)).toBe(false);
  expect(hasTextCoverageEvidence('[Output truncated: omitted]')).toBe(false);
});
