import { expect, test } from "@jest/globals";
import { isValidLockfileDependencyName } from "../../../../../src/checks/general/E-0.1.0.1.1/validate/dependency-name.mjs";

test.each(["alpha", "@scope/pkg", "pkg-name", "pkg_name", "pkg.name"])(
  "accepts valid package names %s",
  (name) => {
    expect(isValidLockfileDependencyName(name)).toBe(true);
  },
);

test.each(["", "bad/name", "@scope", "@/pkg", "@scope/", "../pkg"])(
  "rejects invalid package names %s",
  (name) => {
    expect(isValidLockfileDependencyName(name)).toBe(false);
  },
);
