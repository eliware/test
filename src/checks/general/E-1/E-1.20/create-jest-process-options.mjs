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
  let nodeOptions = process.env.NODE_OPTIONS?.includes("--experimental-vm-modules")
    ? process.env.NODE_OPTIONS
    : `${process.env.NODE_OPTIONS ?? ""} --experimental-vm-modules`.trim();
  if (!nodeOptions.includes("--trace-warnings") && !nodeOptions.includes("--no-warnings")) {
    nodeOptions = `${nodeOptions} --no-warnings`;
  }
  const environment = Object.fromEntries(Object.entries({ ...process.env, NODE_OPTIONS: nodeOptions }).filter(([key]) =>
    /^(?:path|node_path|node_options|ci|force_color|term|temp|tmp|home|user|username|logname|lang|lc_all|systemroot|comspec|windir|pathext|userprofile|appdata|localappdata|init_cwd|npm_lifecycle_event|npm_lifecycle_script|npm_execpath|npm_node_execpath|npm_config_cache|npm_config_local_prefix|npm_config_user_agent)$/iu.test(key),
  ));
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
