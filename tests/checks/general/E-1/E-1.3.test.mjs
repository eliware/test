import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.3.mjs";

test("accepts a package that delegates validation to the shared harness", async () => {
  await expect(
    run({ packageJson: { scripts: { test: "eliware-test", lint: "eliware-test --lint" } } }),
  ).resolves.toEqual({
    ruleId: "E-1.3",
    status: "pass",
    message: "",
  });
});

test("accepts an absent package configuration at this check boundary", async () => {
  await expect(run({})).resolves.toEqual({ ruleId: "E-1.3", status: "pass", message: "" });
});

test("rejects direct validation commands in package scripts", async () => {
  await expect(run({ packageJson: { scripts: { test: "jest" } } })).resolves.toEqual(
    expect.objectContaining({ ruleId: "E-1.3", status: "fail" }),
  );
});

test("rejects direct validation tool dependencies", async () => {
  await expect(run({ packageJson: { devDependencies: { jest: "^30.0.0" } } })).resolves.toEqual(
    expect.objectContaining({ ruleId: "E-1.3", status: "fail" }),
  );
});

test("rejects direct validation-tool use in repository validation files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-3-"));
  await writeFile(join(root, "validate.mjs"), "import { run } from 'oxlint';\n");
  await expect(run({ root, packageJson: {}, files: ["validate.mjs"] })).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-1.3",
      status: "fail",
      message: expect.stringContaining("validate.mjs"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports repository validation files that cannot be inspected", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-3-error-"));
  await expect(run({ root, packageJson: {}, files: ["src/missing.mjs"] })).resolves.toEqual({
    ruleId: "E-1.3",
    status: "fail",
    message: expect.stringContaining("could not be inspected"),
  });
  await rm(root, { recursive: true, force: true });
});

test("passes after inspecting a repository with no direct tool use", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-3-clean-"));
  await expect(run({ root, packageJson: {}, files: [] })).resolves.toEqual({
    ruleId: "E-1.3",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("discovers repository files when the validation context does not provide them", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-3-discovery-"));
  await writeFile(join(root, "README.md"), "clean\n");
  await expect(run({ root, packageJson: {} })).resolves.toEqual({
    ruleId: "E-1.3",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});
