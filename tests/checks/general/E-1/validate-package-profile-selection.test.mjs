import { expect, test } from "@jest/globals";
import { validatePackageProfileSelection } from "../../../../src/checks/general/E-1/validate-package-profile-selection.mjs";

test("accepts each declared Eliware profile", () => {
  for (const profile of ["general", "application", "cli", "web", "discord", "mcp-server", "library", "documentation", "workspace", "infrastructure", "npm-published", "ghcr-published", "private", "fork"]) {
    expect(validatePackageProfileSelection({ eliware: { apply: [profile] } })).toBeNull();
  }
});

test("requires a nonempty list of known profile names", () => {
  for (const apply of [undefined, [], "general", [""], ["unknown"], [null]]) {
    expect(validatePackageProfileSelection({ eliware: { apply } })).toContain("eliware.apply");
  }
});
