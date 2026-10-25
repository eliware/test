export function createActiveSuiteTracker(initialSuite = "unknown test suite") {
  let activeSuite = initialSuite;
  return {
    current() {
      return activeSuite;
    },
    observe(line) {
      const startsSuite = line.match(/^\[eliware-test-progress\] start (.+)$/u);
      const completesSuite = line.match(/^\[eliware-test-progress\] complete (.+?) [\d.]+s$/u);
      if (startsSuite) activeSuite = startsSuite[1];
      if (completesSuite) activeSuite = "unknown test suite";
    },
  };
}
