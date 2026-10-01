import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { resolveAuditExecutable } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-audit-executable.mjs";

test("selects npm executable variants", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-audit-npm-path-"));
  const npmCli = join(root, "npm-cli.js");
  await writeFile(npmCli, "");
  try {
    expect(resolveAuditExecutable()).toEqual(expect.any(Array));
    expect(resolveAuditExecutable({ env: {}, platform: "linux", execPath: "/node" })).toEqual([
      "npm",
      [],
    ]);
    expect(() =>
      resolveAuditExecutable({ env: { PATH: "" }, platform: "win32", execPath: "C:\\node.exe" }),
    ).toThrow("Unable to resolve the npm CLI on Windows");
    expect(
      resolveAuditExecutable({
        env: { npm_execpath: "npm-cli.js" },
        platform: process.platform,
        execPath: process.execPath,
        root,
      }),
    ).toEqual([process.execPath, [npmCli]]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
