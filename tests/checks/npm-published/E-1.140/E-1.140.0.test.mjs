import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/npm-published/E-1.140/E-1.140.0.mjs";

const packageJson = {
  name: "@eliware/fixture",
  version: "8.0.0",
  files: ["bin/", "src/", "README.md"],
  scripts: { pack: "eliware-test --pack" },
};
const validGuidance = `## npm publication
Public package @eliware/fixture uses package.json as version source; its files allowlist contains bin/, src/, README.md. Run eliware-test --pack and require it to pass. npm provenance is enabled. Verify the exact version in the public registry. Publication requires explicit authorization through the Operations handoff.
`;

test("requires publication guidance in AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-npm-"));
  await writeFile(join(root, "AGENTS.md"), validGuidance);
  await expect(run({ root, packageJson })).resolves.toEqual({
    ruleId: "E-1.140.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects missing or irrelevant publication guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-npm-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.140.0",
    status: "fail",
    message: "AGENTS.md must document npm publication requirements.",
  });
  await writeFile(join(root, "AGENTS.md"), "## npm publication\nPackage identity and version.\n");
  await expect(run({ root, packageJson })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await writeFile(
    join(root, "AGENTS.md"),
    "## Project\nPublication wording outside the profile section.\n",
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "AGENTS.md"), validGuidance.replace("src/", "lib/"));
  await expect(run({ root, packageJson })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(root, { recursive: true, force: true });
});
