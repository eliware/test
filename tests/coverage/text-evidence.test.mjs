import { hasTextCoverageEvidence } from '../../src/coverage/text-evidence.mjs';
test('detects text coverage evidence', () => expect(hasTextCoverageEvidence('File | % Stmts | % Branch |\na | 100% | 100% |')).toBe(true));
