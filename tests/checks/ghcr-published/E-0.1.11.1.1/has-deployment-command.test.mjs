import { expect, test } from "@jest/globals";
import { hasDeploymentCommand } from "../../../../src/checks/ghcr-published/E-0.1.11.1.1/has-deployment-command.mjs";

test("detects deployment commands at the start of workflow lines", () => {
  expect(hasDeploymentCommand([{ run: "echo check\nkubectl apply -f app.yaml" }])).toBe(true);
});

test.each([
  "kubectl apply -f app.yaml",
  "helm upgrade app ./chart",
  "helm install app ./chart",
  "terraform apply -auto-approve",
  "ansible-playbook deploy.yaml",
  "flyctl deploy",
  "wrangler deploy",
  "docker stack deploy app",
  "echo check && kubectl get pods",
])("detects prohibited command %s", (run) => {
  expect(hasDeploymentCommand([{ run }])).toBe(true);
});

test("accepts workflows without deployment commands", () => {
  expect(hasDeploymentCommand([{ run: "npm test" }, { uses: "docker/build-push-action@v6" }])).toBe(
    false,
  );
});

test("allows image publication and verification commands", () => {
  expect(
    hasDeploymentCommand([
      { run: "docker buildx imagetools inspect $IMAGE_NAME@$DIGEST" },
      { run: "gh attestation verify oci://$IMAGE_NAME@$DIGEST --repo eliware/test" },
    ]),
  ).toBe(false);
});
