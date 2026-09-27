import { expect, test } from "@jest/globals";
import { validateKnitCommandStructure } from "../../../../../src/checks/general/E-0.1/E-0.1.10/validate-knit-command-structure.mjs";

const call = (command, args = []) => ({ kind: "spawnSync", command, args });

test("accepts bare statically inspectable commands in the validation allowlist", () => {
  expect(validateKnitCommandStructure({ calls: [call("npm", ["test"])] })).toBeNull();
  expect(validateKnitCommandStructure({ calls: [call("npm.cmd", ["test"])] })).toBeNull();
});

test("rejects executable or unsupported AST operations", () => {
  expect(validateKnitCommandStructure({ leadingExecutable: true, calls: [] })).toContain(
    "must not execute JavaScript",
  );
  expect(validateKnitCommandStructure({ unsupported: [1], calls: [] })).toContain(
    "unsupported dynamic or state-mutating operation",
  );
});

test("requires static command tokens and an allowlisted executable", () => {
  expect(validateKnitCommandStructure({ calls: [call(undefined)] })).toContain(
    "statically inspectable",
  );
  expect(
    validateKnitCommandStructure({ calls: [call("curl", ["https://example.test"])] }),
  ).toContain("outside the read-only validation allowlist");
  for (const command of ["C:\\Program Files\\nodejs\\npm.cmd", "../npm", "/usr/bin/npm"]) {
    expect(validateKnitCommandStructure({ calls: [call(command, ["test"])] })).toContain(
      "outside the read-only validation allowlist",
    );
  }
});
