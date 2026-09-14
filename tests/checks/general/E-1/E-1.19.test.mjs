import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.19.mjs";

const valid = {
  name: "@eliware/fixture",
  version: "8.0.0",
  description: "fixture",
  keywords: ["fixture"],
  author: "Eliware",
  license: "MIT",
  repository: { url: "https://github.com/eliware/fixture" },
  engines: { node: ">=26 <27" },
  jest: {},
  type: "module",
  scripts: { test: "eliware-test" },
  eliware: {
    apply: ["general"],
    authority: { authoritativeFor: ["metadata"], notAuthoritativeFor: ["behavior"] },
    crosslinks: [{ path: "../docs/authority-map.json", relation: "relatedAuthority", authoritativeFor: "ownership" }],
  },
};

test("accepts the required scoped package metadata", () => {
  expect(run({ packageJson: valid })).toEqual({ ruleId: "E-1.19", status: "pass", message: "" });
  expect(run({ packageJson: { ...valid, author: { name: "Eliware" } } })).toEqual({
    ruleId: "E-1.19",
    status: "pass",
    message: "",
  });
});

test("rejects an unscoped package or missing runtime metadata", () => {
  expect(run({ packageJson: { ...valid, name: "fixture" } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  expect(run({ packageJson: { ...valid, engines: { node: ">=20" } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test.each([
  ["version", "8"],
  ["description", ""],
  ["author", { name: "" }],
  ["keywords", ["", "valid"]],
  ["repository", { url: "" }],
  ["jest", []],
])("rejects invalid %s metadata", (field, value) => {
  expect(run({ packageJson: { ...valid, [field]: value } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("rejects a package with no version", () => {
  expect(run({ packageJson: { ...valid, version: undefined } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test.each([">=26 <27", "26", "26.x", "^26.1.0", "~26.2.0"])("accepts Node.js requirement %s", (node) => {
  expect(run({ packageJson: { ...valid, engines: { node } } })).toEqual({
    ruleId: "E-1.19",
    status: "pass",
    message: "",
  });
});

test.each([">=26", ">=25", ">=26 <28", "27", "^27.0.0"])("rejects ranges that permit a non-26 Node.js major: %s", (node) => {
  expect(run({ packageJson: { ...valid, engines: { node } } })).toEqual(expect.objectContaining({ status: "fail" }));
});

test("requires an explicit allowlist for public npm package contents", () => {
  const published = {
    ...valid,
    eliware: { ...valid.eliware, apply: ["general", "npm-published"] },
    publishConfig: { access: "public", provenance: true },
  };
  expect(run({ packageJson: published })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(
    run({
      packageJson: {
        ...published,
        files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
      },
    }),
  ).toEqual({ ruleId: "E-1.19", status: "pass", message: "" });
  expect(
    run({ packageJson: { ...published, files: ["README.md", "LICENSE"] } }),
  ).toEqual(
    expect.objectContaining({
      status: "fail",
      message: "Public npm package files must allowlist: RELEASE_NOTES.md, docs, specs.",
    }),
  );
});

test("rejects broad publication allowlists", () => {
  const published = {
    ...valid,
    eliware: { ...valid.eliware, apply: ["general", "npm-published"] },
    publishConfig: { access: "public", provenance: true },
    files: ["."],
  };
  expect(run({ packageJson: published })).toEqual({
    ruleId: "E-1.19",
    status: "fail",
    message: "Public npm package files must not use broad or wildcard allowlist entries.",
  });
});
