export function findSlowTestFindings(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^\[eliware-test-progress\] slow (.+?) :: (.+?) :: ([\d.]+)s$/))
    .filter(Boolean)
    .map(([, suite, name, duration]) => `Slow test in ${suite}: ${name} took ${duration}s (limit: 5s).`);
}
