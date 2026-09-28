import { expect, test } from "@jest/globals";
import {
  requiredSyntaxExtensions,
  selectMaintainedFileSyntaxParser,
} from "../../../../src/checks/general/E-0.1/maintained-file-syntax-parser.mjs";

test("selects and executes parsers for maintained syntax extensions", async () => {
  const files = [
    ["entry.MJS", "export {};"],
    ["source.js", "const value = 1;"],
    ["source.cjs", "return;"],
    ["view.jsx", "const value = <main />;"],
    ["source.ts", "const value: number = 1;"],
    ["view.tsx", "const value = <main /> as JSX.Element;"],
    ["config.json", "{}"],
    ["config.yml", "key: value"],
    ["config.yaml", "key: value"],
    ["guide.MD", "# Heading"],
  ];
  for (const [file, source] of files) {
    const selected = selectMaintainedFileSyntaxParser(file);
    expect(selected.parse).toEqual(expect.any(Function));
    expect(await selected.parse(source)).toBeDefined();
  }
});

test("reports missing parsers and only requires the maintained extension set", () => {
  expect(selectMaintainedFileSyntaxParser("src/app.bin").parse).toBeNull();
  expect([...requiredSyntaxExtensions]).toEqual([".mjs", ".json", ".yml", ".yaml", ".md"]);
});

test("uses an injected parser map for focused validation", () => {
  const parser = () => true;
  expect(selectMaintainedFileSyntaxParser("file.custom", new Map([[".custom", parser]]))).toEqual({
    extension: ".custom",
    parse: parser,
  });
});
