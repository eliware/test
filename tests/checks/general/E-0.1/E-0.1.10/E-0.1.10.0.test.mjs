import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.10/E-0.1.10.0.mjs";

test("rejects publication and deployment commands from Knit validation", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-0.1.10.0",
    status: "pass",
    message: "",
  });
});

test("uses a cached parsed Knit AST when supplied by the validation run", async () => {
  const source = 'import { spawnSync } from "node:child_process"; spawnSync("npm", ["test"]);';
  const parseAst = async () => parse(source, { sourceType: "module", plugins: ["importAttributes", "topLevelAwait"] });

  await expect(run({ root: process.cwd(), parseAst })).resolves.toEqual({
    ruleId: "E-0.1.10.0",
    status: "pass",
    message: "",
  });
});

test("reports syntax errors from the shared AST cache", async () => {
  await expect(run({ root: process.cwd(), parseAst: async () => { throw new SyntaxError("invalid source"); } })).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("not valid JavaScript: invalid source") }),
  );
});

test.each([
  ["npm", ["publish"]],
  ["kubectl", ["apply", "-f", "production.yaml"]],
  ["git", ["push", "origin", "main"]],
])("rejects prohibited Knit command %s", async (command, args) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    `import { spawnSync } from "node:child_process"; spawnSync(${JSON.stringify(command)}, ${JSON.stringify(args)});\n`,
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects dynamic Knit subprocess commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    'import { spawnSync } from "node:child_process"; spawnSync(command, args);\n',
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects filesystem and dynamic module side effects", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    'import * as fs from "node:fs"; fs.rm("./output", { recursive: true });\n',
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects non-allowlisted static commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-"));
  await mkdir(join(root, ".knit"));
  await writeFile(join(root, ".knit", "validate.mjs"), 'import { spawnSync } from "node:child_process"; spawnSync("curl", ["https://example.test"]);');
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail", message: expect.stringContaining("allowlist") }));
  await rm(root, { recursive: true, force: true });
});

test("reports malformed and missing Knit scripts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-errors-"));
  await mkdir(join(root, ".knit"));
  await writeFile(join(root, ".knit", "validate.mjs"), "export const = ;");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("not valid JavaScript") }),
  );
  await rm(root, { recursive: true, force: true });
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-knit-missing-"));
  await expect(run({ root: missing })).resolves.toEqual({
    ruleId: "E-0.1.10.0",
    status: "fail",
    message: ".knit/validate.mjs is required for Knit validation.",
  });
  await rm(missing, { recursive: true, force: true });
});

test("rejects calls whose command tokens are not statically inspectable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-tokens-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    'import { spawnSync } from "node:child_process"; spawnSync(123, ["ok"]);',
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("statically inspectable") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects filesystem mutation found in otherwise static Knit source", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-static-side-effect-"));
  await mkdir(join(root, ".knit"));
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    `import { spawnSync } from "node:child_process"; const note = 'fs.rm("output")'; spawnSync("echo", ["ok"]);`,
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("unsupported filesystem") }),
  );
  await rm(root, { recursive: true, force: true });
});
