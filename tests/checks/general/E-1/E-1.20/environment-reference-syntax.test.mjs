import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { isProcessEnv, propertyName } from "../../../../../src/checks/general/E-1/E-1.20/environment-reference-syntax.mjs";

test("recognizes direct and computed process.env syntax", () => {
  const ast = parse("process.env.PORT; process['env']['TOKEN'];", { sourceType: "module" });
  const [direct, computed] = ast.program.body.map(({ expression }) => expression);
  expect(isProcessEnv(direct.object)).toBe(true);
  expect(isProcessEnv(computed.object)).toBe(true);
  expect(propertyName(direct.property)).toBe("PORT");
  expect(propertyName(computed.property)).toBe("TOKEN");
  expect(propertyName(null)).toBeUndefined();
});
