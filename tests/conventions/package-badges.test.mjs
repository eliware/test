import { checkPublicBadges } from '../../src/conventions/package-badges.mjs';

test('derives public badge destinations from package metadata', () => {
  expect(checkPublicBadges('[npm](https://www.npmjs.com/package/@eliware/demo) [license](LICENSE) [ci](https://github.com/eliware/demo/actions/workflows/nodejs.yml)', '@eliware/demo', 'https://github.com/eliware/demo')).toEqual([]);
  expect(checkPublicBadges('', 'demo')).toEqual([]);
  expect(checkPublicBadges('', '@eliware/demo', { url: 'https://github.com/eliware/demo.git' })).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('npmjs') })]));
  expect(checkPublicBadges('', '@eliware/demo', undefined)).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('actions/workflows') })]));
});
