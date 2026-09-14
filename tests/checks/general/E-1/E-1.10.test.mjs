import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.10.mjs";

test("requires the Knit validation script", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-"));
  await mkdir(join(root, ".knit"));
  await writeFile(join(root, ".knit", "validate.mjs"), "export default {};\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.10", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("fails when the Knit validation script is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.10",
    status: "fail",
    message: ".knit/validate.mjs is required for Knit validation.",
  });
  await rm(root, { recursive: true, force: true });
});
