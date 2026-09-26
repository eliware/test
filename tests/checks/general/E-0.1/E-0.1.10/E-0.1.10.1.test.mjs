import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.10/E-0.1.10.1.mjs";

test("requires the exact Knit command sequence", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-0.1.10.1",
    status: "pass",
    message: "",
  });
});

test("uses a cached parsed Knit AST when supplied by the validation run", async () => {
  const source = 'import { spawnSync } from "node:child_process"; spawnSync("git", ["pull", "--ff-only", "origin", "main"]); spawnSync("npm", ["ci"]); spawnSync("npm", ["test"]);';
  const parseAst = async () => parse(source, { sourceType: "module", plugins: ["importAttributes", "topLevelAwait"] });

  await expect(run({ root: process.cwd(), parseAst })).resolves.toEqual({
    ruleId: "E-0.1.10.1",
    status: "pass",
    message: "",
  });
});

test("reports syntax errors from the shared AST cache", async () => {
  await expect(run({ root: process.cwd(), parseAst: async () => { throw new SyntaxError("invalid source"); } })).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("not valid JavaScript: invalid source") }),
  );
});

test("rejects commands that appear before the required prefix", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-order-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    "console.log('before');\ngit pull --ff-only origin main\nnpm ci\nnpm test\n",
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects executable statements before the command sequence", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-order-leading-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    '0; import { spawnSync } from "node:child_process"; spawnSync("git", ["pull", "--ff-only", "origin", "main"]); spawnSync("npm", ["ci"]); spawnSync("npm", ["test"]);',
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("required synchronization") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects reordered structured subprocess commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-order-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    'import { spawnSync } from "node:child_process";\n' +
      'for (const [command, args] of [["npm", ["ci"]], ["git", ["pull", "--ff-only", "origin", "main"]], ["npm", ["test"]]]) spawnSync(command, args);\n',
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("reports malformed or missing Knit scripts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-order-errors-"));
  await mkdir(join(root, ".knit"));
  await writeFile(join(root, ".knit", "validate.mjs"), "export const = ;");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("not valid JavaScript") }),
  );
  await rm(root, { recursive: true, force: true });
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-knit-order-missing-"));
  await expect(run({ root: missing })).resolves.toEqual({
    ruleId: "E-0.1.10.1",
    status: "fail",
    message: ".knit/validate.mjs is required for Knit validation.",
  });
  await rm(missing, { recursive: true, force: true });
});

test("rejects incomplete and dynamically tokenized command sequences", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-order-short-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    'import { spawnSync } from "node:child_process"; spawnSync("git", ["pull", "--ff-only", "origin", "main"]); spawnSync("npm", ["ci"]);',
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    'import { spawnSync } from "node:child_process"; spawnSync(123, []); spawnSync("npm", ["ci"]); spawnSync("npm", ["test"]);',
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});
