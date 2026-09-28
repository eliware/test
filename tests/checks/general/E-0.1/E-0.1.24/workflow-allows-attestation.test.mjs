import { expect, test } from "@jest/globals";
import { workflowAllowsAttestation } from "../../../../../src/checks/general/E-0.1/E-0.1.24/workflow-allows-attestation.mjs";

test("allows attestations only for the GHCR publication profile", () => {
  expect(workflowAllowsAttestation({ eliware: { apply: ["ghcr-published"] } })).toBe(true);
  expect(workflowAllowsAttestation({ eliware: { apply: ["npm-published"] } })).toBe(false);
  expect(workflowAllowsAttestation({ eliware: { apply: "ghcr-published" } })).toBe(false);
  expect(workflowAllowsAttestation({})).toBe(false);
});
