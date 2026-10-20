import { expect, test } from "@jest/globals";
import { validateGhcrAuthentication } from "../../../../../src/checks/shared/publish-workflow/validate/ghcr-authentication.mjs";

const login = {
  uses: "docker/login-action@v3",
  with: {
    registry: "ghcr.io",
    username: "${{ github.actor }}",
    password: "${{ secrets.GITHUB_TOKEN }}",
  },
};
const image = { uses: "docker/build-push-action@v7" };
const workflow = {
  jobs: {
    publish: {
      permissions: { packages: "write" },
      steps: [login, image],
    },
  },
};

test("accepts GHCR login before the image push", () => {
  expect(validateGhcrAuthentication(workflow)).toEqual([]);
});

test("requires package write permission", () => {
  expect(validateGhcrAuthentication({ jobs: { publish: { steps: [login, image] } } })).toContain(
    "specs/workflows/ghcr.yaml publish job must grant packages: write.",
  );
});

test("reports a missing steps list", () => {
  expect(
    validateGhcrAuthentication({ jobs: { publish: { permissions: { packages: "write" } } } }),
  ).toContain("specs/workflows/ghcr.yaml publish job must log in with docker/login-action@v3.");
});

test.each([
  [[], "specs/workflows/ghcr.yaml publish job must log in with docker/login-action@v3."],
  [
    [{ ...login, with: { ...login.with, registry: "docker.io" } }, image],
    "specs/workflows/ghcr.yaml GHCR login must use registry ghcr.io.",
  ],
  [
    [{ ...login, with: { ...login.with, username: "other" } }, image],
    "specs/workflows/ghcr.yaml GHCR login must use github.actor as the username.",
  ],
  [
    [{ ...login, with: { ...login.with, password: "other" } }, image],
    "specs/workflows/ghcr.yaml GHCR login must use secrets.GITHUB_TOKEN as the password.",
  ],
  [[image, login], "specs/workflows/ghcr.yaml GHCR login must appear before the image push."],
])("rejects an invalid GHCR login", (steps, error) => {
  expect(
    validateGhcrAuthentication({
      jobs: { publish: { permissions: { packages: "write" }, steps } },
    }),
  ).toContain(error);
});
