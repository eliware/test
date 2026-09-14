import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/infrastructure/E-1.90/A-1.90.0/A-1.90.0.1.mjs";

test("requires infrastructure ownership boundaries", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-infra-boundary-"));
  await writeFile(
    join(root, "AGENTS.md"),
    "managed targets ownership validation change control rollback secret desired state runtime",
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.90.0.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports missing boundaries and missing AGENTS files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-infra-boundary-"));
  await writeFile(join(root, "AGENTS.md"), "managed targets ownership validation");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.90.0.1",
    status: "fail",
    message:
      "AGENTS.md is missing infrastructure boundaries: change control, rollback, secret, desired state, runtime.",
  });
  await rm(root, { recursive: true, force: true });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.90.0.1",
    status: "fail",
    message: "AGENTS.md is required before infrastructure boundaries can be reviewed.",
  });
});
