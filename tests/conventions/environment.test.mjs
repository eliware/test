import { checkEnvironmentExample } from '../../src/conventions/environment.mjs';

test('checks required and optional environment examples', () => {
  expect(checkEnvironmentExample('REQUIRED=placeholder\n# OPTIONAL=default', 'process.env.REQUIRED')).toEqual([]);
  expect(checkEnvironmentExample('REQUIRED=', 'process.env.MISSING')).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('placeholder') }), expect.objectContaining({ message: expect.stringContaining('MISSING') })]));
});

test('rejects credential-like values and undocumented variables', () => {
  const findings = checkEnvironmentExample('TOKEN=real-token\n# OPTIONAL=', 'process.env.MISSING');
  expect(findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ message: expect.stringContaining('credential-like') }),
    expect.objectContaining({ message: expect.stringContaining('optional variable OPTIONAL') }),
    expect.objectContaining({ message: expect.stringContaining('MISSING') }),
  ]));
});

test('supports the default source argument', () => {
  expect(checkEnvironmentExample('')).toEqual([]);
});
