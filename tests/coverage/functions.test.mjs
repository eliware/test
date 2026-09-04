import { uncoveredFunctions } from '../../src/coverage/functions.mjs';
test('maps uncovered functions', () => expect(uncoveredFunctions({ f: { a: 0 }, fnMap: { a: { name: 'run', loc: { start: { line: 1 } } } } })).toEqual([{ name: 'run', start: { line: 1 } }]));
test('handles fallback, anonymous, and malformed function metadata', () => { expect(uncoveredFunctions({ f: { a: 0 }, fnMap: { a: { locations: [{ start: { line: 2 } }] } } })[0]).toMatchObject({ start: { line: 2 }, name: 'anonymous' }); expect(uncoveredFunctions({ f: [], fnMap: {} })).toEqual([{ type: 'function', name: 'unknown' }]); });
test('handles missing maps and covered functions', () => { expect(uncoveredFunctions({ f: { a: 1 }, fnMap: {} })).toEqual([]); expect(uncoveredFunctions({ f: { a: 0 }, fnMap: { a: null } })[0].name).toBe('unknown'); });
test('handles metadata without a usable location', () => expect(uncoveredFunctions({ f: { a: 0 }, fnMap: { a: { name: 'run', loc: null, locations: [] } } })[0]).toEqual({ name: 'run' }));
test('handles non-object primary locations', () => expect(uncoveredFunctions({ f: { a: 0 }, fnMap: { a: { name: 'run', loc: [] } } })[0]).toEqual({ name: 'run' }));
test('uses unknown names for primitive metadata', () => expect(uncoveredFunctions({ f: { a: 0 }, fnMap: { a: 'invalid' } })[0].name).toBe('unknown'));
test('accepts null function counters as empty coverage', () => expect(uncoveredFunctions({ f: null, fnMap: {} })).toEqual([]));
test('handles non-object function maps', () => expect(uncoveredFunctions({ f: { a: 0 }, fnMap: 'invalid' })[0].name).toBe('unknown'));
