import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/A-1.20.18.mjs";

const prettier = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  proseWrap: "preserve",
  endOfLine: "lf",
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
  expect(run({ packageJson: { prettier: { ...prettier, extraOption: true } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  const missingSetting = Object.fromEntries(
    Object.entries(prettier).filter(([key]) => key !== "endOfLine"),
  );
  expect(run({ packageJson: { prettier: missingSetting } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});
