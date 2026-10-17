import { expect, test } from "@jest/globals";
import { hasPosixMachineSpecificPath } from "../../../../../src/checks/general/E-0.1.0.1.9/machine-specific-paths/posix-paths.mjs";

function posixPath(...parts) {
  return ["", ...parts].join("/");
}

test("detects machine-specific POSIX paths", () => {
  expect(
    hasPosixMachineSpecificPath(
      [
        posixPath("home", "eli", "project"),
        posixPath("users", "admin", "app"),
        posixPath("srv", "app"),
      ].join(" "),
    ),
  ).toBe(true);
});

test("allows the approved container account and mount paths", () => {
  expect(
    hasPosixMachineSpecificPath(
      [
        posixPath("home", "node", ".cache"),
        posixPath("home", "argocd", ".config"),
        posixPath("home", "runner", "_work"),
        posixPath("srv", "repository"),
        posixPath("srv", "workspace"),
      ].join(" "),
    ),
  ).toBe(false);
});

test("does not treat routes or other POSIX paths as machine paths", () => {
  expect(
    hasPosixMachineSpecificPath(
      [
        posixPath("admin", "app", "users", ":id"),
        posixPath("api", "users", "me"),
        posixPath("var", "lib", "service"),
      ].join(" "),
    ),
  ).toBe(false);
});
