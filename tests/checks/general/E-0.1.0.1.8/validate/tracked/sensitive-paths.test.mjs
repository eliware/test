import { expect, jest, test } from "@jest/globals";
import { validateTrackedSensitivePaths } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/tracked/sensitive-paths.mjs";

const gitIndex = (paths) =>
  Buffer.from(paths.map((path) => `100644 ${"a".repeat(40)} 0\t${path}\0`).join(""));

test("accepts tracked paths outside the protected names", async () => {
  const runGit = jest
    .fn()
    .mockResolvedValue({ stdout: gitIndex(["src/index.mjs", ".env.example"]) });
  await expect(validateTrackedSensitivePaths("repo", runGit)).resolves.toEqual([]);
  expect(runGit).toHaveBeenCalledTimes(1);
});

test("rejects environment files and credential paths without case sensitivity", async () => {
  await expect(
    validateTrackedSensitivePaths("repo", async () => ({
      stdout: gitIndex([
        ".env",
        ".env.local",
        "config/ID_RSA",
        "deploy/Credentials/production.yaml",
        "certs/production.PEM",
        "config/secrets/token.json",
      ]),
    })),
  ).resolves.toEqual([
    "Tracked sensitive paths are prohibited: .env, .env.local, config/ID_RSA, deploy/Credentials/production.yaml, certs/production.PEM, config/secrets/token.json.",
  ]);
});

test("allows only the exact environment example name", async () => {
  await expect(
    validateTrackedSensitivePaths("repo", async () => ({
      stdout: gitIndex([".env.example", "nested/.env.example", ".env.example.local"]),
    })),
  ).resolves.toEqual(["Tracked sensitive paths are prohibited: .env.example.local."]);
});

test("reports an unreadable Git index", async () => {
  await expect(
    validateTrackedSensitivePaths("repo", async () => {
      throw new Error("index unavailable");
    }),
  ).resolves.toEqual(["Git index status could not be read. Sensitive paths are unknown."]);
});
