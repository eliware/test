import { jest } from '@jest/globals';
import { checkWorkspacePolicies } from '../../src/workspace/check-workspace-policies.mjs';

test('reports Istanbul violations without checking later policies', async () => {
    const write = jest.fn();
    const find = jest.fn(async () => [{ file: 'src/a.mjs', line: 2 }]);

    await expect(checkWorkspacePolicies('repo', write, undefined, find)).resolves.toBe(false);
    expect(write).toHaveBeenCalledWith('Istanbul ignore directives are not permitted here: src/a.mjs:2\n');
});

test('runs Gitignore policy when Istanbul policy passes', async () => {
    const accessPath = jest.fn();
    const write = jest.fn();
    const find = jest.fn(async () => []);

    await expect(checkWorkspacePolicies('repo', write, accessPath, find)).resolves.toBe(true);
    expect(accessPath).toHaveBeenCalled();
});

test('accepts default collaborators when the caller omits them', async () => {
    await expect(checkWorkspacePolicies('test-fixtures/exclusions', jest.fn())).resolves.toBe(true);
});
