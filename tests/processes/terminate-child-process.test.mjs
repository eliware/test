import { terminateChildProcess } from '../../src/processes/terminate-child-process.mjs';

test('terminates a child directly', () => {
  const signals = [];
  terminateChildProcess({ kill: (signal) => signals.push(signal) }, 'SIGTERM', 'win32', () => { throw new Error('not used'); });
  expect(signals).toEqual(['SIGTERM']);
});

test('terminates a supported process group before the child', () => {
  const signals = [];
  terminateChildProcess({ pid: 7, __eliwareProcessGroup: true, kill: (signal) => signals.push(['child', signal]) }, 'SIGKILL', 'linux', (pid, signal) => signals.push([pid, signal]));
  expect(signals).toEqual([[-7, 'SIGKILL'], ['child', 'SIGKILL']]);
});
