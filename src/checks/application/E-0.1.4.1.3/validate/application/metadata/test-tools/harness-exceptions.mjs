const allowedHarnessTestTools = new Set(["@jest/globals", "jest", "istanbul-lib-instrument"]);
export default function isAllowedHarnessTestTool(packageName, dependencyName) {
  return packageName === "@eliware/test" && allowedHarnessTestTools.has(dependencyName);
}
