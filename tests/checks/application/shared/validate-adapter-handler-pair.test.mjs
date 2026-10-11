import { expect, test } from "@jest/globals";
import { validateAdapterHandlerPair } from "../../../../src/checks/application/shared/validate-adapter-handler-pair.mjs";

function inventory(adapterSource, handlerSource) {
  return {
    readText: async (path) => (path === "adapter.mjs" ? adapterSource : handlerSource),
  };
}

test("accepts an adapter that re-exports a default handler function", async () => {
  await expect(
    validateAdapterHandlerPair(
      inventory('export { default } from "../src/handler.mjs";', "export default () => {};"),
      "adapter.mjs",
      "handler.mjs",
      "../src/handler.mjs",
    ),
  ).resolves.toEqual([]);
});

test("reports an adapter mismatch and a non-function handler", async () => {
  await expect(
    validateAdapterHandlerPair(
      inventory('export { value } from "./wrong.mjs";', "export default 1;"),
      "adapter.mjs",
      "handler.mjs",
      "../src/handler.mjs",
    ),
  ).resolves.toEqual([
    "adapter.mjs must re-export its matching source handler.",
    "handler.mjs must default-export a function.",
  ]);
});

test.each([
  "export default 1;",
  'export { default } from "../src/handler.mjs"; export const extra = 1;',
  'export { value as default } from "../src/handler.mjs";',
])("rejects adapters that do not expose one matching default re-export", async (source) => {
  await expect(
    validateAdapterHandlerPair(
      inventory(source, "export default () => {};"),
      "adapter.mjs",
      "handler.mjs",
      "../src/handler.mjs",
    ),
  ).resolves.toContain("adapter.mjs must re-export its matching source handler.");
});

test("reports syntax errors for both files", async () => {
  await expect(
    validateAdapterHandlerPair(
      inventory("export {", "export default ("),
      "adapter.mjs",
      "handler.mjs",
      "target",
    ),
  ).resolves.toEqual([
    expect.stringContaining("adapter.mjs could not be inspected:"),
    expect.stringContaining("handler.mjs could not be inspected:"),
  ]);
});
