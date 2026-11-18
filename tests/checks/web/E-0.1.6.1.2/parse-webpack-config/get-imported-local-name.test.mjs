import { expect, test } from "@jest/globals";
import method from "../../../../../src/checks/web/E-0.1.6.1.2/parse-webpack-config/get-imported-local-name.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
