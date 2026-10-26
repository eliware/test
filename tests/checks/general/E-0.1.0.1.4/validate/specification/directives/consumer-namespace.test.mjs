import { expect, test } from "@jest/globals";
import { getConsumerDirectiveNamespace } from "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/directives/consumer-namespace.mjs";

test("reads the consumer namespace from Eliware package metadata", () => {
  expect(getConsumerDirectiveNamespace({ eliware: { id: "E-123" } })).toBe("E-123");
  expect(getConsumerDirectiveNamespace({ eliware: {} })).toBeUndefined();
  expect(getConsumerDirectiveNamespace()).toBeUndefined();
});
