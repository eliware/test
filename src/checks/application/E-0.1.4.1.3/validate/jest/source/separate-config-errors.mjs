import findSeparateTestRunnerConfigs from "../../../find-separate-test-runner-configs.mjs";

export default function findSeparateTestRunnerConfigErrors(paths) {
  return findSeparateTestRunnerConfigs(paths).map(
    (path) => `${path} is a separate test runner or coverage configuration file.`,
  );
}
