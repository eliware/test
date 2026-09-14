import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.7.mjs";

test("requires Jest configuration in package.json", async () => {
  expect(await run({ packageJson: { jest: {} } })).toEqual({
    ruleId: "E-1.20.7",
    status: "pass",
    message: "",
  });
  expect(await run({ packageJson: {} })).toEqual(expect.objectContaining({ status: "fail" }));
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
