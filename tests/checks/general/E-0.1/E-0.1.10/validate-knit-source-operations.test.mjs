import { expect, test } from "@jest/globals";
import { validateKnitSourceOperations } from "../../../../../src/checks/general/E-0.1/E-0.1.10/validate-knit-source-operations.mjs";

test("rejects source code containing unsupported external operations", () => {
  for (const source of [
    'import fs from "node:fs"; fs.rm("output");',
    'fetch("https://example.test");',
    'https.request("https://example.test");',
    'net.connect(443, "example.test");',
    "process.exit(1);",
  ]) {
    expect(validateKnitSourceOperations(source)).toContain("unsupported filesystem, network, process");
  }
});

test("conservatively rejects source text matching unsupported operation patterns", () => {
  expect(validateKnitSourceOperations('const example = `fs.rm("output")`; // fetch("url")')).toContain(
    "unsupported filesystem, network, process",
  );
  expect(validateKnitSourceOperations('import { spawnSync } from "node:child_process";')).toBeNull();
});
