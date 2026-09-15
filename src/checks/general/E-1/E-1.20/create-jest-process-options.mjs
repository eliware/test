export function createJestProcessOptions(root, args = [], options = {}) {
  const debugTiming = args.includes("--debug-timing");
  let currentSuite = "Jest startup";
  const onProgress = (text) => {
    for (const line of text.split(/\r?\n/)) {
      const suite = line.match(/^\[eliware-test-progress\] start (.+)$/);
      if (suite) currentSuite = suite[1];
      const test = line.match(/^\[eliware-test-progress\] test (.+?) :: (.+?) [\d.]+s$/);
      if (test) currentSuite = `${test[1]} :: ${test[2]}`;
    }
  };
  let nodeOptions = process.env.NODE_OPTIONS?.includes("--experimental-vm-modules")
    ? process.env.NODE_OPTIONS
    : `${process.env.NODE_OPTIONS ?? ""} --experimental-vm-modules`.trim();
  if (!nodeOptions.includes("--trace-warnings") && !nodeOptions.includes("--no-warnings")) {
    nodeOptions = `${nodeOptions} --no-warnings`;
  }
  return {
    cwd: root,
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
    ...(debugTiming ? {
      progressPattern: /^\[eliware-test-progress\]/m,
      progressTimeoutMs: 15_000,
      onProgress,
    } : {}),
    onTimeout: () => {
      options.onTimeout?.(`Test suite ${currentSuite} timed out after 15 seconds without progress.`);
    },
    ...(args.includes("--debug-timing") ? { maxOutputLength: 10_000_000 } : {}),
    ...(options.onStderr ? {
      onStderr: (text) => options.onStderr(text.replace(/^\[eliware-test-progress\].*\r?\n?/gm, "")),
    } : {}),
  };
}
