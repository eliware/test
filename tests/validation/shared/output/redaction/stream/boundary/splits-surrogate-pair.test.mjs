import { expect, test } from "@jest/globals";
import method from "../../../../../../../src/validation/shared/output/redaction/stream/boundary/splits-surrogate-pair.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
