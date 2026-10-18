import { expect, test } from "@jest/globals";
import { helpText } from "../../src/cli/help-text.mjs";

test("lists validation modes and focused test usage", () => {
  expect(helpText.split("\n")).toEqual(
    expect.arrayContaining([
      "Usage: eliware-test [--help|--version]",
      "       eliware-test [--debug-timing] [focused-test-path ...] [-- Jest arguments]",
      "Focused-test arguments after -- go to Jest.",
      "Do not put --debug-timing after --.",
    ]),
  );
});
