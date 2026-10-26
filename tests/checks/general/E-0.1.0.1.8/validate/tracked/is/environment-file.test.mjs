import { expect, test } from "@jest/globals";
import { isEnvironmentFile } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/tracked/is/environment-file.mjs";

test.each([".env", ".env.local", ".ENV.production", ".envrc"])(
  "detects environment file %s",
  (name) => {
    expect(isEnvironmentFile(name)).toBe(true);
  },
);

test.each([".env.example", "README.md", "environment"])(
  "does not classify %s as an environment file",
  (name) => {
    expect(isEnvironmentFile(name)).toBe(false);
  },
);
