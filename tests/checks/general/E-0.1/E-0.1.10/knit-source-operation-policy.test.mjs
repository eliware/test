import { expect, test } from "@jest/globals";
import {
  effectGlobals,
  networkOperations,
  processOperations,
  sideEffectModules,
  sideEffectRoots,
} from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-source-operation-policy.mjs";

test("defines filesystem, process, and network operation policy", () => {
  expect(sideEffectModules.has("node:fs/promises")).toBe(true);
  expect(sideEffectRoots.has("dgram")).toBe(true);
  expect(effectGlobals.has("globalThis")).toBe(true);
  expect(processOperations.has("abort")).toBe(true);
  expect(networkOperations.has("createConnection")).toBe(true);
});
