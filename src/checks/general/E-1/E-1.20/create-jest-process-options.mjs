export function createJestProcessOptions(root, args = [], options = {}) {
  let currentSuite = "Jest startup";
  const onProgress = (text) => {
    for (const line of text.split(/\r?\n/)) {
      const suite = line.match(/^\[eliware-test-progress\] start (.+)$/);
      if (suite) currentSuite = suite[1];
      const test = line.match(/^\[eliware-test-progress\] test (.+?) :: (.+?) [\d.]+s$/);
      if (test) currentSuite = `${test[1]} :: ${test[2]}`;
    }
  };
  const existingNodeOptions = process.env.NODE_OPTIONS?.trim() ?? "";
  const hasOption = (option) => new RegExp(`(?:^|[\\s])${option.replace("-", "\\-")}(?:$|[\\s])`).test(existingNodeOptions);
  const nodeOptions = [
    existingNodeOptions,
    hasOption("--experimental-vm-modules") ? "" : "--experimental-vm-modules",
    /(?:^|[\s])(?:--trace-warnings|--no-warnings)(?:$|[\s])/.test(existingNodeOptions) ? "" : "--no-warnings",
  ].filter(Boolean).join(" ");
  const environment = { ...process.env, NODE_OPTIONS: nodeOptions };
  return {
    cwd: root,
    env: environment,
    progressPattern: /^\[eliware-test-progress\]/m,
    progressTimeoutMs: 15_000,
    onProgress,
    onTimeout: () => {
      options.onTimeout?.(`Test suite ${currentSuite} timed out after 15 seconds without progress.`);
    },
    ...(args.includes("--debug-timing") ? { maxOutputLength: 1_000_000 } : {}),
    ...(options.onStderr ? { onStderr: options.onStderr } : {}),
  };
}
