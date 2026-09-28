import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validatePathRecords } from "../../../../src/checks/documentation/E-0.1.100/validate-path-records.mjs";

test("validates authority path record collections", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-records-"));
  const file = join(root, "authority.json");
  await writeFile(join(root, "target.json"), "{}");
  await expect(validatePathRecords({ root, file, records: null, label: "records" })).resolves.toBe(
    "records must be an array.",
  );
  await expect(
    validatePathRecords({ root, file, records: [null], label: "records" }),
  ).resolves.toBe("records[0] must contain a path.");
  await expect(
    validatePathRecords({ root, file, records: [{ path: "./target.json" }], label: "records" }),
  ).resolves.toBeNull();
  await expect(
    validatePathRecords({ root, file, records: [{ path: "./missing.json" }], label: "records" }),
  ).resolves.toBe("records[0] does not resolve: ./missing.json.");
});

test("reports every invalid path record", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-records-multiple-"));
  const result = await validatePathRecords({
    root,
    file: join(root, "authority.json"),
    records: [null, { path: "./missing-one.json" }, { path: "./missing-two.json" }],
    label: "records",
  });
  expect(result).toContain("records[0]");
  expect(result).toContain("missing-one.json");
  expect(result).toContain("missing-two.json");
  await rm(root, { recursive: true, force: true });
});
