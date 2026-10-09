import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { run, ruleId } from "../../../src/checks/shared/E-0.1.0.1.3.mjs";

test("validates this repository README", async () => {
  await expect(
    run({ root: process.cwd(), packageJson: JSON.parse(await readFile("package.json", "utf8")) }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("reports a missing README", async () => {
  await expect(run({ root: "missing" })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "README.md is required.",
  });
});

test("uses default context and reports missing package metadata", async () => {
  await expect(run(undefined, undefined)).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("README.md title must match package.json.name."),
  });
});

test("uses an injected README reader", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const readme = await readFile("README.md", "utf8");
  await expect(
    run({ root: process.cwd(), packageJson }, { read: async () => readme }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
