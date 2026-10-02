import { expect, test } from "@jest/globals";
import { isProhibitedPublishCommand } from "../../../../../src/checks/general/E-0.1/E-0.1.24/is-prohibited-publish-command.mjs";

test("rejects npm publish commands, including chained and option-bearing forms", () => {
  for (const command of [
    "npm publish",
    "npm --workspace=@eliware/test publish",
    "npm test && npm publish",
    "npm test; npm publish",
  ]) {
    expect(isProhibitedPublishCommand(command)).toBe(true);
  }
});

test("rejects common commands that publish images to GHCR", () => {
  for (const command of [
    "docker push ghcr.io/eliware/example:latest",
    "podman push ghcr.io/eliware/example:latest",
    "buildah push image ghcr.io/eliware/example:latest",
    "docker buildx build --push -t ghcr.io/eliware/example:latest .",
    "oras push ghcr.io/eliware/example:latest file:artifact",
    "crane push image.tar ghcr.io/eliware/example:latest",
    "skopeo copy image docker://ghcr.io/eliware/example:latest",
  ]) {
    expect(isProhibitedPublishCommand(command)).toBe(true);
  }
});

test("allows unrelated commands and non-string values", () => {
  for (const command of [
    "npm test",
    "npm run publish",
    "echo npm publish",
    "docker build .",
    42,
    null,
  ]) {
    expect(isProhibitedPublishCommand(command)).toBe(false);
  }
});
