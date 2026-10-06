import { expect, test } from "@jest/globals";
import { validatePackageLock } from "../../../../src/checks/general/E-0.1.0.1.1/validate-package-lock.mjs";

const pkg = { name: "@eliware/example", version: "12.0.0" };
const validLock = {
  name: pkg.name,
  version: pkg.version,
  lockfileVersion: 3,
  packages: { "": { name: pkg.name, version: pkg.version } },
};
const readLock = (value) => async () => JSON.stringify(value);

test("accepts matching package lock metadata", async () => {
  await expect(validatePackageLock("/repo", pkg, { read: readLock(validLock) })).resolves.toEqual(
    [],
  );
});

test("reports invalid lock JSON", async () => {
  await expect(
    validatePackageLock("/repo", pkg, { read: async () => "bad json" }),
  ).resolves.toEqual(["package-lock.json must exist and contain valid JSON."]);
});

test("rejects non-object lock JSON", async () => {
  await expect(validatePackageLock("/repo", pkg, { read: async () => "null" })).resolves.toEqual([
    "package-lock.json must contain a JSON object.",
  ]);
});

test("rejects package identity, lock version, and root package differences", async () => {
  await expect(
    validatePackageLock("/repo", pkg, { read: readLock({ ...validLock, name: "other" }) }),
  ).resolves.toContain("package-lock.json name and version must match package.json.");
  await expect(
    validatePackageLock("/repo", pkg, { read: readLock({ ...validLock, lockfileVersion: 2 }) }),
  ).resolves.toContain("package-lock.json must use lockfile version 3.");
  await expect(
    validatePackageLock("/repo", pkg, {
      read: readLock({ ...validLock, packages: { "": { name: "other", version: pkg.version } } }),
    }),
  ).resolves.toContain("package-lock.json root package metadata must match package.json.");
  await expect(
    validatePackageLock("/repo", pkg, { read: readLock({ ...validLock, packages: [] }) }),
  ).resolves.toContain("package-lock.json must contain a packages object and root entry.");
});

test("checks dependency maps and direct dependency entries", async () => {
  const packageJson = { ...pkg, dependencies: { alpha: "1" }, devDependencies: { beta: "2" } };
  const lock = {
    ...validLock,
    packages: {
      "": {
        name: pkg.name,
        version: pkg.version,
        dependencies: { alpha: "wrong" },
        devDependencies: [],
      },
      "node_modules/alpha": { version: "1", dependencies: { missing: "1" } },
    },
  };
  const errors = await validatePackageLock("/repo", packageJson, { read: readLock(lock) });
  expect(errors.join("\n")).toContain("dependencies must match");
  expect(errors.join("\n")).toContain("devDependencies must be an object");
  expect(errors.join("\n")).toContain("every direct dependency: beta");
  expect(errors.join("\n")).toContain("references missing dependency missing");
});

test("reports malformed package dependency maps", async () => {
  const errors = await validatePackageLock(
    "/repo",
    { ...pkg, peerDependencies: [] },
    { read: readLock(validLock) },
  );
  expect(errors).toContain("package.json peerDependencies must be an object.");
});

test("rejects null dependency maps and malformed dependency ranges", async () => {
  const packageJson = { ...pkg, dependencies: null };
  const errors = await validatePackageLock("/repo", packageJson, { read: readLock(validLock) });
  expect(errors).toContain("package.json dependencies must be an object.");

  const malformed = await validatePackageLock(
    "/repo",
    { ...pkg, dependencies: { alpha: [] } },
    {
      read: readLock({
        ...validLock,
        packages: {
          "": { name: pkg.name, version: pkg.version, dependencies: { alpha: [] } },
          "node_modules/alpha": { version: "1.0.0" },
        },
      }),
    },
  );
  expect(malformed).toContain(
    "package.json dependencies has an invalid dependency range for alpha.",
  );
});

test("requires each locked direct package version to satisfy its declared range", async () => {
  const errors = await validatePackageLock(
    "/repo",
    { ...pkg, dependencies: { alpha: "^2.0.0" } },
    {
      read: readLock({
        ...validLock,
        packages: {
          "": { name: pkg.name, version: pkg.version, dependencies: { alpha: "^2.0.0" } },
          "node_modules/alpha": { version: "1.5.0" },
        },
      }),
    },
  );
  expect(errors).toContain("package-lock.json version for alpha does not satisfy ^2.0.0.");
});

test("accepts npm alias ranges and rejects unsupported direct ranges", async () => {
  const packageJson = { ...pkg, dependencies: { alias: "npm:actual@^1.0.0" } };
  const lock = {
    ...validLock,
    packages: {
      "": { name: pkg.name, version: pkg.version, dependencies: packageJson.dependencies },
      "node_modules/alias": { version: "1.2.0" },
    },
  };
  await expect(
    validatePackageLock("/repo", packageJson, { read: readLock(lock) }),
  ).resolves.toEqual([]);
  const invalid = await validatePackageLock(
    "/repo",
    { ...pkg, dependencies: { alias: "file:../alias" } },
    {
      read: readLock({
        ...lock,
        packages: {
          ...lock.packages,
          "": { ...lock.packages[""], dependencies: { alias: "file:../alias" } },
        },
      }),
    },
  );
  expect(invalid).toContain(
    "package.json dependencies has an unsupported dependency range for alias.",
  );
});
