import { expect, test } from "@jest/globals";
import { readPackManifest } from "../../../../src/validation/stages/pack/read-pack-manifest.mjs";
import { redactCredentialFields } from "../../../../src/validation/shared/output/redaction/redact/credential-fields.mjs";

const files = [{ path: "package.json" }];

test("reads the requested package manifest", () => {
  expect(readPackManifest(JSON.stringify([{ name: "target", files }]), "target")).toEqual({
    entry: { name: "target", files },
  });
});

test("reads npm pack JSON for a package name that contains webhook", () => {
  const manifest = JSON.stringify([
    { name: "@eliware/discord-webhook", files: [{ path: "package.json" }] },
  ]);
  const output = redactCredentialFields(manifest);
  expect(readPackManifest(output, "@eliware/discord-webhook")).toEqual({
    entry: { name: "@eliware/discord-webhook", files: [{ path: "package.json" }] },
  });
});

test("reports when the requested package entry does not exist", () => {
  expect(readPackManifest("{}", "target").error).toContain("requested package");
  expect(readPackManifest("null").error).toContain("files array");
});

test("recovers numeric npm metadata redacted in command output", () => {
  const output = JSON.stringify({
    target: {
      name: "target",
      size: 12034,
      files: [{ path: "package.json", size: 123, mode: 420 }],
      entryCount: 1,
    },
  }).replaceAll("123", "[REDACTED]3");
  expect(readPackManifest(output, "target")).toMatchObject({ entry: { name: "target" } });
});

test("reports invalid JSON when output cannot be recovered", () => {
  expect(readPackManifest("not json").error).toBe("npm pack returned invalid JSON manifest.");
  expect(readPackManifest('{"size":[REDACTED]2,}').error).toBe(
    "npm pack returned invalid JSON manifest.",
  );
});
