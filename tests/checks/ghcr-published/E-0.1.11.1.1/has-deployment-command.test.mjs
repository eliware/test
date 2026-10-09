import { expect, test } from "@jest/globals";
import { hasDeploymentCommand } from "../../../../src/checks/ghcr-published/E-0.1.11.1.1/has-deployment-command.mjs";

test("detects deployment commands at the start of workflow lines", () => {
  expect(hasDeploymentCommand([{ run: "echo check\nkubectl apply -f app.yaml" }])).toBe(true);
});

test("accepts workflows without deployment commands", () => {
  expect(hasDeploymentCommand([{ run: "npm test" }, { uses: "docker/build-push-action@v6" }])).toBe(
    false,
  );
});
