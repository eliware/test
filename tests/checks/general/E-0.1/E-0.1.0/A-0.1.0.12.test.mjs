import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.0/A-0.1.0.12.mjs";

const guidance = [
  "single responsibility: one cohesive purpose and one reason to change",
  "business-logic modules and coordinators, including coordinators of coordinators",
  "distinct responsibility into a focused submodule with a mirrored test",
  "do not add the new responsibility to an existing module",
  "During ordinary review, do not ignore mixed responsibilities you notice; refactor them",
  "passing them does not prove a module is cohesive",
  "or permit mixed responsibilities",
].join(". ");

async function check(content) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-single-responsibility-agents-"));
  await writeFile(join(root, "AGENTS.md"), content);
  const result = await run({ root });
  await rm(root, { recursive: true, force: true });
  return result;
}

test("requires explicit single-responsibility, decomposition, review, and line-count guidance", async () => {
  await expect(check(`## Development\n${guidance}`)).resolves.toEqual({
    ruleId: "A-0.1.0.12",
    status: "pass",
    message: "",
  });
});

test("reports missing single-responsibility guidance", async () => {
  await expect(check("## Development\nCreate focused modules and review code.")).resolves.toEqual(
    expect.objectContaining({
      ruleId: "A-0.1.0.12",
      status: "fail",
      message: expect.stringContaining("single responsibility"),
    }),
  );
});

test("requires the guidance in the Development section", async () => {
  await expect(
    check(`## Layout\n${guidance}\n## Development\nRead the specification.`),
  ).resolves.toMatchObject({
    ruleId: "A-0.1.0.12",
    status: "fail",
  });
});
