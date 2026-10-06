import { expect, test } from "@jest/globals";
import { extractMarkdownAssets } from "../../../../src/checks/general/E-0.1.0.1.4/extract-markdown-assets.mjs";

test("extracts inline, reference, and HTML image targets", () => {
  expect(
    extractMarkdownAssets(
      "![inline](one.png) ![reference][asset]\n[asset]: two.png\n<img src='three.png'>",
    ),
  ).toEqual([{ reference: "one.png" }, { reference: "two.png" }, { reference: "three.png" }]);
});

test("ignores image targets inside Markdown code and comments", () => {
  expect(
    extractMarkdownAssets("`![inline](bad.png)` <!-- <img src='bad.png'> --> ![ok](good.png)"),
  ).toEqual([{ reference: "good.png" }]);
});

test("handles shortcut, missing, and angle-bracket image references", () => {
  expect(
    extractMarkdownAssets(
      "![shortcut] ![missing][undefined] ![angle](<angle.png>)\n[shortcut]: short.png",
    ),
  ).toEqual([{ reference: "short.png" }, { reference: null }, { reference: "angle.png" }]);
  expect(extractMarkdownAssets("![not a reference]")).toEqual([]);
});
