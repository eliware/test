import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.7.mjs";

test("requires Jest configuration in package.json", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-valid-"));
  expect(await run({ root, packageJson: { jest: {} } })).toEqual({
    ruleId: "E-1.20.7",
    status: "pass",
    message: "",
  });
  expect(await run({ root, packageJson: {} })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(await run({ root, packageJson: { jest: [] } })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(await run({ root, packageJson: { jest: null } })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(await run({ root, packageJson: { jest: "jest" } })).toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects separate Jest configuration files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-config-"));
  await writeFile(join(root, "jest.config.mjs"), "export default {};\n");
  await expect(run({ root, packageJson: { jest: {} } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports configuration inspection failures", async () => {
  await expect(run({ root: "C:\\missing-repository", packageJson: { jest: {} } })).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-1.20.7",
      status: "fail",
      message: expect.stringContaining("Jest configuration files could not be inspected"),
    }),
  );
});

test("reports failures when the repository root cannot be enumerated", async () => {
  const root = join(await mkdtemp(join(tmpdir(), "eliware-test-jest-root-")), "not-a-directory");
  await writeFile(root, "not a directory");
  await expect(run({ root, packageJson: { jest: {} } })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("could not be inspected") }),
  );
  await rm(root, { force: true });
});
