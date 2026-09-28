import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectImports } from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-import-analysis.mjs";

test("collects named, aliased, and namespace child-process imports", () => {
  const { names, namespaces } = collectImports(
    parse(
      'import { exec, spawn as run } from "node:child_process"; import * as child from "child_process";',
      { sourceType: "module" },
    ).program,
  );

  expect(names).toEqual(
    new Map([
      ["exec", "exec"],
      ["run", "spawn"],
    ]),
  );
  expect(namespaces).toEqual(new Set(["child"]));
});

test("ignores imports that do not provide child-process functions", () => {
  const imports = collectImports(
    parse(
      'import { rm } from "node:fs/promises"; import "node:fs"; import { fork } from "node:child_process";',
      { sourceType: "module" },
    ).program,
  );

  expect(imports).toEqual({ names: new Map(), namespaces: new Set() });
});
