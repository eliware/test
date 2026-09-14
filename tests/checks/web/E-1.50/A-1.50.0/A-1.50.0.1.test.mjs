import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/web/E-1.50/A-1.50.0/A-1.50.0.1.mjs";

test("requires web topics in AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-web-topics-"));
  await writeFile(join(root, "AGENTS.md"), "routes assets configuration browser deployment port");
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await writeFile(join(root, "AGENTS.md"), "routes");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});

test("reports missing web topics and AGENTS files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-web-topics-"));
  await writeFile(join(root, "AGENTS.md"), "routes assets");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.50.0.1",
    status: "fail",
    message: "AGENTS.md must document web concerns: configuration, browser, deployment, port.",
  });
  await expect(run({ root: `${root}-missing` })).resolves.toEqual({
    ruleId: "A-1.50.0.1",
    status: "fail",
    message: "AGENTS.md is required before web requirements can be reviewed.",
  });
});
