import { resolvePackage } from '../../src/validation/resolve-package.mjs';
test('prefers consumer package resolution', () => { const consumer = { resolve: () => 'consumer' }; const bundled = { resolve: () => 'bundled' }; expect(resolvePackage('x', consumer, bundled)).toBe('consumer'); });
test('falls back to bundled package resolution', () => { const consumer = { resolve: () => { throw new Error('missing'); } }; expect(resolvePackage('x', consumer, { resolve: () => 'bundled' })).toBe('bundled'); });
