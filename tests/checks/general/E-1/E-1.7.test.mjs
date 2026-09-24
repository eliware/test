import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.7.mjs";

test("rejects infrastructure-internal identifiers", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-"));
  await writeFile(
    join(root, "config.json"),
    JSON.stringify({ host: ["db", "internal", "eliware", "org"].join(".") }),
  );
  await expect(run({ root, files: ["config.json"] })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(root, { recursive: true, force: true });
});

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
])("rejects internal infrastructure details in %s", async (file, content) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-"));
  const directory = file.includes("/") ? join(root, file.slice(0, file.lastIndexOf("/"))) : root;
  if (directory !== root) await mkdir(directory, { recursive: true });
  await writeFile(join(root, file), content);
  await expect(run({ root, files: [file] })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(root, { recursive: true, force: true });
});

test("accepts files without infrastructure-internal identifiers", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-public-"));
  await writeFile(join(root, "config.json"), JSON.stringify({ host: "Café localhost" }));
  await expect(run({ root, files: ["config.json"] })).resolves.toEqual({
    ruleId: "E-1.7",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("ignores binary files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-public-"));
  await writeFile(join(root, "image.bin"), Buffer.from([0, 1, 2]));
  await writeFile(join(root, "example.md"), "Public documentation.");
  await expect(run({ root, files: ["image.bin", "example.md"] })).resolves.toEqual({
    ruleId: "E-1.7",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("ignores invalid UTF-8 and control-character binaries without scanning their payload", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-binary-"));
  const internalLabel = ["eliware", "internal"].join("-");
  await writeFile(
    join(root, "invalid.bin"),
    Buffer.concat([Buffer.from(internalLabel), Buffer.from([0xff])]),
  );
  await writeFile(
    join(root, "control.bin"),
    Buffer.from(`${internalLabel}${String.fromCharCode(0x85)}`, "utf8"),
  );
  await expect(run({ root, files: ["invalid.bin", "control.bin"] })).resolves.toEqual({
    ruleId: "E-1.7",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("inspects tracked files when no file list is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-discovery-"));
  await writeFile(join(root, "config.json"), '{"host":"localhost"}');
  await expect(
    run({ root, files: null, readTracked: async () => ["config.json"] }),
  ).resolves.toEqual({
    ruleId: "E-1.7",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("skips public-content scanning for private repositories", async () => {
  const readTracked = jest.fn();
  await expect(
    run({ root: "/repo", packageJson: { private: true }, readTracked }),
  ).resolves.toEqual({
    ruleId: "E-1.7",
    status: "pass",
    message: "",
  });
  expect(readTracked).not.toHaveBeenCalled();
});

test("fails closed when tracked-file inspection is unavailable", async () => {
  await expect(run({ root: "/repo", readTracked: async () => null })).resolves.toEqual({
    ruleId: "E-1.7",
    status: "fail",
    message:
      "Git tracked-file inspection was unavailable; cannot validate public repository contents safely.",
  });
});

test("reports unreadable repository files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-error-"));
  await expect(run({ root, files: ["missing.json"] })).resolves.toEqual({
    ruleId: "E-1.7",
    status: "fail",
    message: expect.stringContaining("Repository files could not be inspected"),
  });
  await rm(root, { recursive: true, force: true });
});
