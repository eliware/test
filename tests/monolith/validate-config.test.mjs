import { validateMonolithConfig } from '../../src/monolith/validate-config.mjs';

test('accepts positive limits and justified exemptions', () => {
  const config = { source: 100, test: 200, exemptions: [{ pattern: 'barrel', reason: 'public entry point' }] };
  expect(validateMonolithConfig(config)).toBe(config);
});

test.each([
  [{ source: 0, test: 200, exemptions: [] }, 'positive integers'],
  [{ source: 100, test: 200, exemptions: [{}] }, 'pattern and non-empty reason'],
])('rejects invalid configuration: %p', (config, message) => {
  expect(() => validateMonolithConfig(config)).toThrow(message);
});
