import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/library/E-1.40/A-1.40.5.mjs";

test("requires a public entrypoint and package allowlist", () => {
  expect(run({ packageJson: { main: "src/index.mjs", files: ["src"] } }).status).toBe("pass");
  expect(run({ packageJson: { files: ["src"] } }).status).toBe("fail");
  expect(run({ packageJson: { main: "src/index.mjs", files: [] } }).status).toBe("fail");
});
