import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.1.mjs";

test("requires the current Node.js major", () => {
  const result = run({ nodeVersion: "26.1.0" });
  expect(result.ruleId).toBe("E-1.20.1");
  expect(result.status).toBe("pass");
  expect(run({ nodeVersion: "25.9.0" }).status).toBe("fail");
  expect(run({ nodeVersion: "not-a-version" }).status).toBe("fail");
  expect(run().status).toBe(Number.parseInt(process.versions.node.split(".")[0], 10) === 26 ? "pass" : "fail");
});
