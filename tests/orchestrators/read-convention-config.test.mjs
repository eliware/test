import { expect, test } from "@jest/globals";
import { readConventionConfig } from "../../src/orchestrators/read-convention-config.mjs";

test("requires a non-empty explicit apply list", () => {
  expect(readConventionConfig({ eliware: { apply: ["general"] } })).toEqual({ apply: ["general"] });
  expect(() => readConventionConfig({ eliware: { apply: [] } })).toThrow(
    "must define eliware.apply",
  );
  expect(() => readConventionConfig({ eliware: { apply: ["general", ""] } })).toThrow(
    "array of group names",
  );
});
