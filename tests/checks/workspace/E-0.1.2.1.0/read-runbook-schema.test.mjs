import { expect, test } from "@jest/globals";
import { readRunbookSchema } from "../../../../src/checks/workspace/E-0.1.2.1.0/read-runbook-schema.mjs";

test("reads the bundled runbook schema", async () => {
  await expect(readRunbookSchema()).resolves.toMatchObject({
    type: "object",
    required: ["schema-version", "title", "steps"],
  });
});

test("rejects invalid and multi-document schema YAML", async () => {
  await expect(readRunbookSchema(async () => "schema: [")).rejects.toThrow();
  await expect(readRunbookSchema(async () => "type: object\n---\ntype: object")).rejects.toThrow(
    "one YAML document",
  );
});

test("propagates schema read errors", async () => {
  await expect(
    readRunbookSchema(async () => {
      throw new Error("denied");
    }),
  ).rejects.toThrow("denied");
});
