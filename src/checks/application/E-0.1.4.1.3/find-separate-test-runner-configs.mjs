const testRunnerConfiguration =
  /^(?:jest\.config|\.jestrc|vitest\.(?:config|workspace)|\.mocharc|mocha\.config|ava\.config|\.nycrc|nyc\.config|c8\.config|playwright\.config|cypress\.config|karma\.conf|jasmine\.config|babel\.config|\.babelrc|\.taprc|tap\.config|tape\.config|uvu\.config|qunit\.config|webdriverio\.config|istanbul\.config)(?:\.[^.]+)?$/iu;

export function findSeparateTestRunnerConfigs(files) {
  return files.filter((path) => testRunnerConfiguration.test(path.split("/").at(-1)));
}
