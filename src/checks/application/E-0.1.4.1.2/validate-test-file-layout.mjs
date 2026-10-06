export function validateTestFileLayout(files) {
  const forbidden = files.filter((path) =>
    /^tests\/(?:.*\/)?(?:artifacts|coverage|test-results|__snapshots__)(?:\/|$)/u.test(path),
  );
  return forbidden.map(
    (path) => `${path} is generated test output; store output under ignored artifacts/.`,
  );
}
