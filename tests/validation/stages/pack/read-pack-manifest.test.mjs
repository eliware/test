import { expect, test } from "@jest/globals";
import { readPackManifest } from "../../../../src/validation/stages/pack/read-pack-manifest.mjs";

const files = [{ path: "package.json" }];

test("reads valid array and object manifests for the requested package", () => {
  expect(readPackManifest(JSON.stringify([{ name: "target", files }]), "target")).toEqual({
    entry: { name: "target", files },
  });
  expect(readPackManifest(JSON.stringify([{ files }]))).toEqual({ entry: { files } });
  expect(readPackManifest(JSON.stringify({ name: "target", files }), "target")).toEqual({
    entry: { name: "target", files },
  });
  expect(readPackManifest(JSON.stringify({ target: { name: "target", files } }), "target")).toEqual(
    { entry: { name: "target", files } },
  );
  expect(readPackManifest(JSON.stringify({ target: { files } }))).toEqual({ entry: { files } });
});

test("rejects missing, mismatched, and ambiguous package entries", () => {
  expect(readPackManifest("{}", "target").error).toContain("requested package");
  expect(readPackManifest(JSON.stringify([{ name: "other", files }]), "target").error).toContain(
    "requested package",
  );
  expect(
    readPackManifest(JSON.stringify({ target: { name: "other", files } }), "target").error,
  ).toContain("requested package");
  expect(readPackManifest(JSON.stringify({ name: "other", files }), "target").error).toContain(
    "requested package",
  );
  expect(readPackManifest(JSON.stringify({ first: { files }, second: { files } })).error).toContain(
    "requested package",
  );
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
