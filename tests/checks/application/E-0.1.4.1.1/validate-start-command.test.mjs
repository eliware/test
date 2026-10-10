import { expect, test } from "@jest/globals";
import { validateStartCommand } from "../../../../src/checks/application/E-0.1.4.1.1/validate-start-command.mjs";

test("allows an absent start script and matches quoted or relative tokens", () => {
  expect(validateStartCommand({}, ["bin/a.mjs"])).toBeNull();
  expect(
    validateStartCommand({ scripts: { start: 'node "./bin/a.mjs"' } }, ["bin/a.mjs"]),
  ).toBeNull();
});

test("rejects invalid start values and unmatched tokens", () => {
  expect(validateStartCommand({ scripts: { start: 4 } }, ["bin/a.mjs"])).toContain(
    "command string",
  );
  expect(validateStartCommand({ scripts: { start: "node bin/ab.mjs" } }, ["bin/a.mjs"])).toContain(
    "standalone token",
  );
  expect(validateStartCommand({ scripts: { start: "" } }, ["bin/a.mjs"])).toContain(
    "standalone token",
  );
});

test("matches equivalent path separators and rejects traversing aliases", () => {
  expect(validateStartCommand({ scripts: { start: "node bin\\app.mjs" } }, ["./bin/app.mjs"])).toBe(
    null,
  );
  expect(
    validateStartCommand({ scripts: { start: "node bin/../bin/app.mjs" } }, ["bin/app.mjs"]),
  ).toContain("standalone token");
  expect(validateStartCommand({ scripts: { start: "node bin/a.mjs" } }, [null])).toContain(
    "standalone token",
  );
});
