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

test("passes a valid package through the metadata validation pipeline", () => {
  expect(run({ packageJson: valid })).toEqual({ ruleId: "E-1.19", status: "pass", message: "" });
});

test.each([
  [{ ...valid, type: "commonjs" }, "package.json.type must be module."],
  [{ ...valid, name: "fixture" }, "package.json.name must be a scoped @eliware/* name."],
  [{ ...valid, description: "" }, "package.json must contain nonempty description and author metadata."],
  [{ ...valid, engines: { node: ">=20" } }, "package.json.engines.node must be compatible with Node.js 26."],
])("maps validator failures to E-1.19", (packageJson, message) => {
  expect(run({ packageJson })).toEqual({
    ruleId: "E-1.19",
    status: "fail",
    message,
  });
});

test("maps publication allowlist failures and passes a valid published package", () => {
  const published = {
    ...valid,
    eliware: { ...valid.eliware, apply: ["general", "npm-published"] },
    publishConfig: { access: "public", provenance: true },
  };
  expect(run({ packageJson: published })).toMatchObject({
    ruleId: "E-1.19",
    status: "fail",
    message: "Public npm packages must define a nonempty files allowlist.",
  });
  expect(run({
    root: process.cwd(),
    packageJson: {
      ...published,
      files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
    },
  })).toEqual({ ruleId: "E-1.19", status: "pass", message: "" });
});
