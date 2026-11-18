import { expect, test } from "@jest/globals";
import findShellCommand from "../../../../../../src/checks/application/E-0.1.4.1.3/command-patterns/recognize/wrappers.mjs";
import isWrappedTestCommand from "../../../../../../src/checks/application/E-0.1.4.1.3/command-patterns/recognize/wrappers/is-wrapped-test-command.mjs";
test("extracts shell command text", () => {
  expect(findShellCommand('sh -c "vitest run"')).toBe("vitest run");
  expect(findShellCommand("npm test")).toBeNull();
});
test("recognizes package-manager runner wrappers", () => {
  const runners = ["jest", "vitest"];
  expect(isWrappedTestCommand("npm exec --package=jest -- jest", runners)).toBe(true);
  expect(isWrappedTestCommand("pnpm dlx vitest run", runners)).toBe(true);
  expect(isWrappedTestCommand("npm run test", runners)).toBe(false);
});
