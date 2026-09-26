import { expect, test } from "@jest/globals";
import { hasRequiredImageAttestations } from "../../../src/checks/ghcr-published/has-required-image-attestations.mjs";

const permissions = {
  "id-token": "write",
  attestations: "write",
  "artifact-metadata": "write",
  contents: "read",
  packages: "write",
};

function push(id, image) {
  return {
    id,
    uses: "docker/build-push-action@v6",
    with: { push: true, tags: `${image}:v1.2.3` },
  };
}

function attestation(id, image) {
  return {
    uses: "actions/attest@v4",
    with: {
      subjectName: image,
      subjectDigest: "${{ steps." + id + ".outputs.digest }}",
      pushToRegistry: true,
    },
  };
}

const publication = { document: { permissions } };

test("requires an ordered matching signed attestation for every pushed image", () => {
  const image = "ghcr.io/eliware/example";
  const job = { steps: [push("build", image), attestation("build", image)] };
  expect(hasRequiredImageAttestations(publication, job)).toBe(true);
  expect(hasRequiredImageAttestations(publication, { steps: [attestation("build", image), push("build", image)] })).toBe(false);
  expect(hasRequiredImageAttestations(publication, { steps: [push("build", image)] })).toBe(false);
});

test("rejects a missing digest identity or insufficient attestation permissions", () => {
  const job = { steps: [push("bad id", "ghcr.io/eliware/example"), attestation("bad id", "ghcr.io/eliware/example")] };
  expect(hasRequiredImageAttestations(publication, job)).toBe(false);
  expect(hasRequiredImageAttestations({ document: { permissions: { ...permissions, attestations: "read" } } }, job)).toBe(false);
});

test("requires a separate matching attestation for every image push", () => {
  const first = "ghcr.io/eliware/first";
  const second = "ghcr.io/eliware/second";
  const firstPush = push("first", first);
  const secondPush = push("second", second);
  expect(hasRequiredImageAttestations(publication, {
    steps: [firstPush, attestation("first", first), secondPush, attestation("second", second)],
  })).toBe(true);
  expect(hasRequiredImageAttestations(publication, {
    steps: [firstPush, attestation("first", first), secondPush],
  })).toBe(false);
});
