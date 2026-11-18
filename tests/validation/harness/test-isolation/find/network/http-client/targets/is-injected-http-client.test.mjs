import { expect, test } from "@jest/globals";
import method from "../../../../../../../../src/validation/harness/test-isolation/find/network/http-client/targets/is-injected-http-client.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
