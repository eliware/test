import { expect, jest, test } from "@jest/globals";

const recognize = jest.fn();
jest.unstable_mockModule(
  "../../../../../../src/checks/application/E-0.1.4.1.3/command-patterns/recognize/package-script.mjs",
  () => ({ hasAlternativePackageScriptCommand: recognize }),
);
const { hasAlternativeToolCommand } =
  await import("../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/has-alternative-tool-command.mjs");

test("delegates command recognition to the shared package-script recognizer", () => {
  recognize.mockReturnValueOnce(true);
  expect(hasAlternativeToolCommand("example command")).toBe(true);
  expect(recognize).toHaveBeenCalledWith("example command");
});
