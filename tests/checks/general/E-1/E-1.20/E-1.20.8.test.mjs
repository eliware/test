import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.8.mjs";

async function fixture(example) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-env-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "module.mjs"),
    "export const value = process.env.EXAMPLE_VALUE;",
  );
  if (example !== null) await writeFile(join(root, ".env.example"), example);
  return root;
}

test("passes when referenced variables are documented", async () => {
  const root = await fixture("# default: fixture allowed: fixture\nEXAMPLE_VALUE=fixture\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.20.8", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("reports missing environment documentation", async () => {
  const root = await fixture("# default: value allowed: value\nOTHER=value\n");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("EXAMPLE_VALUE") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("discovers computed and destructured environment references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-env-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "module.mjs"),
    'const { FIRST } = process.env; export const value = process.env["SECOND"] ?? FIRST;',
  );
  await writeFile(
    join(root, ".env.example"),
    "# default: one allowed: one\nFIRST=one\n# default: two allowed: two\nSECOND=two\n",
  );
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.20.8", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("rejects empty environment examples", async () => {
  const root = await fixture("# default: \nEXAMPLE_VALUE=\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects defaults outside documented allowed values and ranges", async () => {
  const root = await fixture(
    "# default: production allowed: development|staging\nEXAMPLE_VALUE=production\n",
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("allowed values") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("passes when the source tree has no environment references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-env-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "export const value = 1;\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.20.8", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("reports a missing source directory", async () => {
  await expect(run({ root: "C:\\missing-repository" })).resolves.toEqual({
    ruleId: "E-1.20.8",
    status: "fail",
    message: "src/ is required for environment-reference validation.",
  });
});

test("reports a missing env example for referenced variables", async () => {
  const root = await fixture(null);
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.20.8",
    status: "fail",
    message: "Repositories using environment variables must provide .env.example.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports malformed environment-example records", async () => {
  const root = await fixture("EXAMPLE_VALUE=one\nEXAMPLE_VALUE=two\n");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-1.20.8",
      status: "fail",
      message: expect.stringContaining("declared more than once"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports source parse failures instead of skipping environment validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-env-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "broken.mjs"), "export const = process.env.EXAMPLE_VALUE;");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail", message: "src/ is required for environment-reference validation." }));
  await rm(root, { recursive: true, force: true });
});
