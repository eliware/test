import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/web/E-0.1.50/A-0.1.50.3.mjs";

test("requires web README topics", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-web-"));
  await writeFile(
    join(root, "README.md"),
    "purpose requirements setup configuration routes assets ports usage browser operations security support license",
  );
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "README.md"), "purpose");
  const result = await run({ root });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("Web README.md must document requirements.");
  expect(result.message).toContain("Web README.md must document license.");
});

test("reports a missing web README", async () => {
  await expect(run({ root: "C:\\missing-web-repository" })).resolves.toEqual({
    ruleId: "A-0.1.50.3",
    status: "fail",
    message: "Web README.md is required.",
  });
});
