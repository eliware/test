import { expect, jest, test } from "@jest/globals";
import { executeLibraryExamples } from "../../../../src/checks/library/E-1.40/execute-library-examples.mjs";

const examples = [{ name: "basic.mjs" }];

test("executes each example with the repository as working directory", async () => {
  const execute = jest.fn(async () => ({ code: 0, stdout: "", stderr: "" }));
  await expect(executeLibraryExamples("/repo", examples, execute)).resolves.toBeNull();
  expect(execute).toHaveBeenCalledWith(process.execPath, [expect.stringContaining("basic.mjs")], { cwd: "/repo" });
  await expect(executeLibraryExamples("/repo", [], execute)).resolves.toBeNull();
  await expect(executeLibraryExamples("/nonexistent-eliware-library", examples)).resolves.toContain(
    "Example basic.mjs could not run:",
  );
});

test("reports thrown and unsuccessful example execution", async () => {
  await expect(executeLibraryExamples("/repo", examples, async () => {
    throw new Error("spawn failed");
  })).resolves.toBe("Example basic.mjs could not run: spawn failed");
  await expect(executeLibraryExamples("/repo", examples, async () => ({
    code: 1,
    stdout: "out",
    stderr: " err ",
  }))).resolves.toBe("Example basic.mjs failed: out\n err");
  await expect(executeLibraryExamples("/repo", examples, async () => ({ code: 1 }))).resolves.toBe(
    "Example basic.mjs failed.",
  );
});
