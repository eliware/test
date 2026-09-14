import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/A-1.25.0.0.mjs";

test("coordinates structured-reference validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-refs-coordinator-"));
  await writeFile(join(root, "source.json"), JSON.stringify({ value: true }));
  expect((await run({ root })).status).toBe("pass");
});

test("reports malformed JSON through the check boundary", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-invalid-json-check-"));
  await writeFile(join(root, "broken.json"), "{");
  const result = await run({ root });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("broken.json");
});

test("reports structured reference failures through the check boundary", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-reference-check-"));
  await writeFile(
    join(root, "source.json"),
    JSON.stringify({ crosslink: { path: "./missing.json" } }),
  );
  const result = await run({ root });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("Structured reference");
});

test("normalizes structured-reference discovery failures through the check boundary", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-reference-check-root-"));
  await mkdir(join(root, "nested"));
  const result = await run({ root: join(root, "missing") });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("Structured JSON references must be valid and resolvable");
});
