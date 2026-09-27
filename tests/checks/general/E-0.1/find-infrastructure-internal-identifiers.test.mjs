import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findInfrastructureInternalIdentifiers } from "../../../../src/checks/general/E-0.1/find-infrastructure-internal-identifiers.mjs";

test.each([
  ["README.md", `Use https://${["db", "internal", "eliware", "org"].join(".")} for operations.`],
  [
    ".knit/validate.sh",
    ["export CONFIG=/srv/", ["eliware", "internal"].join("-"), "/config"].join(""),
  ],
  [
    "config.json",
    JSON.stringify({ path: ["C:", "Users", "eli", "eliware", "private"].join("\\") }),
  ],
  ["notes.txt", `The ${["private", "eliware", "org"].join(".")} service is not public.`],
])("finds internal infrastructure details in %s", async (file, content) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-scan-"));
  try {
    const directory = file.includes("/") ? join(root, file.slice(0, file.lastIndexOf("/"))) : root;
    if (directory !== root) await mkdir(directory, { recursive: true });
    await writeFile(join(root, file), content);
    await expect(findInfrastructureInternalIdentifiers(root, [file])).resolves.toEqual([file]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignores clean text, invalid UTF-8, and control-character binary content", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-public-scan-"));
  try {
    const internalLabel = ["eliware", "internal"].join("-");
    await writeFile(join(root, "clean.txt"), "Public documentation.");
    await writeFile(
      join(root, "invalid.bin"),
      Buffer.concat([Buffer.from(internalLabel), Buffer.from([0xff])]),
    );
    await writeFile(
      join(root, "control.bin"),
      Buffer.from(`${internalLabel}${String.fromCharCode(0x85)}`, "utf8"),
    );
    await writeFile(join(root, "binary.bin"), Buffer.from(`${internalLabel}\0`, "utf8"));
    await expect(
      findInfrastructureInternalIdentifiers(root, [
        "clean.txt",
        "invalid.bin",
        "control.bin",
        "binary.bin",
      ]),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("propagates unexpected file-read errors", async () => {
  const error = new Error("access denied");
  await expect(
    findInfrastructureInternalIdentifiers("/repo", ["private.txt"], {
      readBytes: async () => {
        throw error;
      },
    }),
  ).rejects.toBe(error);
});

test("skips files removed after tracked-path discovery when requested", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-removed-file-scan-"));
  try {
    await expect(
      findInfrastructureInternalIdentifiers(root, ["removed.mjs"], { skipMissingFiles: true }),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
