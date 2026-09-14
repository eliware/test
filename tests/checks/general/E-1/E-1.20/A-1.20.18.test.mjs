import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/A-1.20.18.mjs";

const prettier = {
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
};

test("requires the canonical Prettier settings", () => {
  expect(run({ packageJson: { prettier } })).toEqual({
    ruleId: "A-1.20.18",
    status: "pass",
    message: "",
  });
  expect(run({ packageJson: { prettier: { ...prettier, printWidth: 80 } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});
