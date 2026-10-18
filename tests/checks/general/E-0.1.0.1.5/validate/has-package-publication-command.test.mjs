import { expect, test } from "@jest/globals";
import { hasPackagePublicationCommand } from "../../../../../src/checks/general/E-0.1.0.1.5/validate/has-package-publication-command.mjs";

test.each([
  "npm publish",
  "npx semantic-release",
  "gh release upload v1.0.0 app.zip",
  "docker push example/image:latest",
  "podman build --push example/image:latest",
  "oras push example/image:latest",
  "skopeo copy source destination",
])("detects publication command %s", (command) => {
  expect(hasPackagePublicationCommand(command)).toBe(true);
});

test.each([undefined, null, 7, "npm test", 'echo "ghcr.io/eliware/example:latest"'])(
  "allows non-publication command %s",
  (command) => {
    expect(hasPackagePublicationCommand(command)).toBe(false);
  },
);
