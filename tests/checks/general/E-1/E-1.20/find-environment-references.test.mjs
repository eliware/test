import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import {
  collect,
  findEnvironmentReferences,
  propertyName,
} from "../../../../../src/checks/general/E-1/E-1.20/find-environment-references.mjs";

test("finds member, computed, aliased, and destructured environment references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-env-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "module.mjs"),
    `
    const env = process.env;
    const { THIRD_VALUE } = process.env;
    export const values = [process.env.FIRST_VALUE, env["SECOND_VALUE"], THIRD_VALUE];
  `,
  );
  await expect(findEnvironmentReferences(root)).resolves.toEqual([
    "FIRST_VALUE",
    "SECOND_VALUE",
    "THIRD_VALUE",
  ]);
  await rm(root, { recursive: true, force: true });
});

test("handles computed env access, invalid names, unsupported properties, and syntax errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-env-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "module.mjs"),
    `
    const env = process["env"];
    const { "FOURTH_VALUE": fourth, lower_value: ignored, ...rest } = process.env;
    export const values = [env.FIFTH_VALUE, process.env[dynamicName], process.env.lower_value, fourth, rest];
  `,
  );
  await writeFile(join(root, "src", "invalid.mjs"), "export {\n");
  await writeFile(join(root, "notes.txt"), "process.env.IGNORED\n");
  await expect(findEnvironmentReferences(root)).rejects.toThrow();
  await rm(root, { recursive: true, force: true });
});

test("reports traversal failures for a missing repository", async () => {
  await expect(findEnvironmentReferences("C:\\missing-repository")).rejects.toBeTruthy();
});

test("ignores empty and unsupported AST nodes", () => {
  const variables = new Set();
  expect(propertyName(null)).toBeUndefined();
  expect(propertyName({ type: "NumericLiteral", value: 1 })).toBeUndefined();
  collect(null, new Set(), variables);
  collect({ type: "Identifier", name: "value" }, new Set(), variables);
  expect(variables).toEqual(new Set());
});

test("ignores environment properties without valid names", () => {
  const variables = new Set();
  collect(
    {
      type: "VariableDeclarator",
      id: { type: "ObjectPattern", properties: [{ type: "ObjectProperty", key: { type: "NumericLiteral" } }] },
      init: { type: "MemberExpression", object: { type: "Identifier", name: "process" }, computed: false, property: { type: "Identifier", name: "env" } },
    },
    new Set(),
    variables,
  );
  collect(
    {
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "process" },
        property: { type: "Identifier", name: "env" },
        computed: false,
      },
      property: { type: "NumericLiteral" },
      computed: true,
    },
    new Set(),
    variables,
  );
  expect(variables).toEqual(new Set());
});
