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

test("recognizes statically resolvable computed template names", () => {
  const ast = parse("process.env[`MAIL_OWNER_ADDRESS`];", { sourceType: "module" });
  expect(propertyName(ast.program.body[0].expression.property)).toBe("MAIL_OWNER_ADDRESS");
});

test("rejects dynamic or non-environment member syntax", () => {
  const ast = parse(
    "process.env[`MAIL_${OWNER}`]; process.env[HOST]; other.env.PORT;",
    { sourceType: "module" },
  );
  const [dynamic, dynamicIdentifier, unrelated] = ast.program.body.map(({ expression }) => expression);
  expect(propertyName(dynamic.property)).toBeUndefined();
  expect(isProcessEnv(dynamic.object)).toBe(true);
  expect(propertyName(dynamicIdentifier.property, dynamicIdentifier.computed)).toBeUndefined();
  expect(isProcessEnv(unrelated.object)).toBe(false);
  expect(isProcessEnv(null)).toBe(false);
});
