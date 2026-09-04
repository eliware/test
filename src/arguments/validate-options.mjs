export function assertCompatibleArguments(lint, runnerArguments) {
  if (lint && runnerArguments.length > 0) throw new Error('`--lint` cannot be combined with test arguments; run `eliware-test --lint` separately.');
}
