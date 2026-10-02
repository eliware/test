import { expect, test } from "@jest/globals";
import { validateCustomScripts } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-custom-scripts.mjs";

const requiredScripts = { test: "eliware-test" };

test("allows arbitrary nonempty custom scripts and ignores required scripts", () => {
  expect(
    validateCustomScripts(
      { test: "eliware-test", start: "node server.mjs", build: "vite build" },
      requiredScripts,
    ),
  ).toEqual([]);
});

test("reports malformed and prohibited custom scripts", () => {
  expect(
    validateCustomScripts(
      {
        test: "eliware-test",
        blank: " ",
        release: "npm publish",
        image: "docker push ghcr.io/eliware/example:latest",
      },
      requiredScripts,
    ),
  ).toEqual([
    "package.json.scripts.blank must be a nonempty command.",
    "package.json.scripts.release must not publish npm packages or GHCR images.",
    "package.json.scripts.image must not publish npm packages or GHCR images.",
  ]);
});
