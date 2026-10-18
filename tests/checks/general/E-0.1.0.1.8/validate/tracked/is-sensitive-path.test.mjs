import { expect, test } from "@jest/globals";
import { isSensitivePath } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/tracked/is-sensitive-path.mjs";

test("detects protected names without case sensitivity", () => {
  expect(isSensitivePath("config/Credentials/token.json")).toBe(true);
  expect(isSensitivePath("config/ID_RSA")).toBe(true);
});

test("detects environment files and sensitive key formats", () => {
  expect(isSensitivePath(".env")).toBe(true);
  expect(isSensitivePath("config/.env.local")).toBe(true);
  expect(isSensitivePath(".envrc")).toBe(true);
  expect(isSensitivePath("certs/client.PFX")).toBe(true);
});

test("allows environment examples and ordinary paths", () => {
  expect(isSensitivePath("nested/.env.example")).toBe(false);
  expect(isSensitivePath("src/index.mjs")).toBe(false);
});

test("normalizes Windows path separators", () => {
  expect(isSensitivePath("config\\secrets\\token.json")).toBe(true);
});
