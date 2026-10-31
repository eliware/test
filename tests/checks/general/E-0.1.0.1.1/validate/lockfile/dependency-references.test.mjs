import { expect, test } from "@jest/globals";
import { validateLockfileDependencyReferences } from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/lockfile/dependency-references.mjs";

test("accepts dependency references resolved at nested and hoisted package levels", () => {
  expect(
    validateLockfileDependencyReferences(
      "node_modules/parent/node_modules/child",
      { dependencies: { hoisted: "^1.0.0" } },
      {
        "node_modules/parent/node_modules/child": {},
        "node_modules/hoisted": { version: "1.2.0" },
      },
    ),
  ).toEqual([]);
});

test("reports invalid dependency maps, names, and ranges", () => {
  expect(
    validateLockfileDependencyReferences(
      "node_modules/parent",
      {
        dependencies: [],
        optionalDependencies: { "bad/name": "1.0.0" },
        peerDependencies: { child: "file:../child" },
      },
      { "node_modules/child": { version: "1.0.0" } },
    ),
  ).toEqual([
    "package-lock.json entry node_modules/parent has invalid dependencies.",
    "package-lock.json entry node_modules/parent has an invalid optionalDependencies package name bad/name.",
    "package-lock.json entry node_modules/parent has an unsupported peerDependencies range for child.",
  ]);
});

test("reports empty dependency ranges", () => {
  expect(
    validateLockfileDependencyReferences(
      "node_modules/parent",
      { dependencies: { child: " " } },
      { "node_modules/child": { version: "1.0.0" } },
    ),
  ).toContain(
    "package-lock.json entry node_modules/parent has an invalid dependencies range for child.",
  );
});

test("reports missing required dependencies and allows optional peers", () => {
  expect(
    validateLockfileDependencyReferences(
      "node_modules/parent",
      {
        dependencies: { absent: "1.0.0" },
        peerDependencies: { optional: "*", required: "*" },
        peerDependenciesMeta: { optional: { optional: true } },
      },
      {},
    ),
  ).toEqual([
    "package-lock.json entry node_modules/parent references missing dependency absent.",
    "package-lock.json entry node_modules/parent references missing dependency required.",
  ]);
});

test("checks locked versions against dependency ranges", () => {
  expect(
    validateLockfileDependencyReferences(
      "node_modules/parent",
      { dependencies: { child: "^2.0.0" } },
      { "node_modules/child": { version: "1.5.0" } },
    ),
  ).toEqual([
    "package-lock.json entry node_modules/parent dependency child does not satisfy its range.",
  ]);
});

test("accepts root and parent-scoped overrides for scoped packages", () => {
  const packageEntry = { dependencies: { joi: "^17.0.0" } };
  const packages = { "node_modules/joi": { version: "18.0.0" } };
  expect(
    validateLockfileDependencyReferences("node_modules/mailauth", packageEntry, packages, {
      joi: "^18.0.0",
    }),
  ).toEqual([]);
  expect(
    validateLockfileDependencyReferences("node_modules/@scope/mailauth", packageEntry, packages, {
      "@scope/mailauth": { joi: "^18.0.0" },
    }),
  ).toEqual([]);
});

test("rejects a locked version that does not satisfy the selected override", () => {
  expect(
    validateLockfileDependencyReferences(
      "node_modules/mailauth",
      { dependencies: { joi: "^17.0.0" } },
      { "node_modules/joi": { version: "17.13.3" } },
      { joi: "^18.0.0" },
    ),
  ).toContain(
    "package-lock.json entry node_modules/joi version does not satisfy root override ^18.0.0.",
  );
});

test("accepts package registry tags and does not check a target without a version", () => {
  expect(
    validateLockfileDependencyReferences(
      "node_modules/parent",
      { dependencies: { tagged: "latest", unversioned: "^1.0.0" } },
      { "node_modules/tagged": { version: "2.0.0" }, "node_modules/unversioned": {} },
    ),
  ).toEqual([]);
});

test("does not validate absent dependency fields", () => {
  expect(validateLockfileDependencyReferences("node_modules/parent", {}, {})).toEqual([]);
});
