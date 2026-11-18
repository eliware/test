import { expect, test } from "@jest/globals";
import resolveAllowedImplementationRoots from "../../../../../../src/checks/application/E-0.1.4.1.2/validate/implementation-placement/allowed-roots.mjs";
test("selects discovery and root-file allowances for active profiles", () => {
  const roots = resolveAllowedImplementationRoots(["discord", "mcp-server", "web"], {});
  expect(roots.allowedDiscoveryPath.test("commands/start.mjs")).toBe(true);
  expect(roots.allowedDiscoveryPath.test("tools/echo.mjs")).toBe(true);
  expect(roots.allowedRootFiles.has("webpack.config.mjs")).toBe(true);
  expect(roots.validatorPaths).toBeInstanceOf(Set);
});
