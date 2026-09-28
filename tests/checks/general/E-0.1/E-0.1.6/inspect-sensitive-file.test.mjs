import { expect, test } from "@jest/globals";
import { isAllowedSensitiveFile } from "../../../../../src/checks/general/E-0.1/E-0.1.6/inspect-sensitive-file.mjs";

const encryptedSecret = `apiVersion: v1
kind: Secret
data:
  token: ENC[AES256_GCM,data:ciphertext,iv:iv,tag:tag,type:str]
sops:
  mac: ENC[AES256_GCM,data:mac,iv:iv,tag:tag,type:str]
  version: 3.9.0
`;

test("allows verified encrypted SOPS secrets but rejects plaintext lookalikes", () => {
  expect(isAllowedSensitiveFile("secrets/app.enc.yaml", encryptedSecret)).toBe(true);
  expect(
    isAllowedSensitiveFile(
      "secrets/app.enc.yaml",
      encryptedSecret.replace(
        "kind: Secret",
        "kind: ENC[AES256_GCM,data:ciphertext,iv:iv,tag:tag,type:str]",
      ),
    ),
  ).toBe(true);
  expect(
    isAllowedSensitiveFile(
      "secrets/app.enc.yaml",
      encryptedSecret.replace(
        "  token: ENC[AES256_GCM,data:ciphertext,iv:iv,tag:tag,type:str]",
        "  nested:\n    token: ENC[AES256_GCM,data:ciphertext,iv:iv,tag:tag,type:str]",
      ),
    ),
  ).toBe(true);
  expect(
    isAllowedSensitiveFile(
      "secrets/app.enc.yaml",
      encryptedSecret.replace(
        "ENC[AES256_GCM,data:ciphertext,iv:iv,tag:tag,type:str]",
        "plaintext-value",
      ),
    ),
  ).toBe(false);
  expect(
    isAllowedSensitiveFile("secrets/app.enc.yaml", "kind: Secret\ndata:\n  token: plain\n"),
  ).toBe(false);
});

test("allows valid secret-management metadata without allowing unrelated YAML", () => {
  expect(
    isAllowedSensitiveFile(
      "infrastructure/app/secrets/ksops-generator.yaml",
      "apiVersion: viaduct.ai/v1\nkind: ksops\nfiles:\n  - ../../secrets/app.enc.yaml\n",
    ),
  ).toBe(true);
  expect(
    isAllowedSensitiveFile(
      "infrastructure/app/secrets/ksops-generator.yaml",
      "apiVersion: viaduct.ai/v1\nkind: ksops\nfiles:\n  - ../../secrets/app.yaml\n",
    ),
  ).toBe(false);
  expect(
    isAllowedSensitiveFile(
      "clusters/prod/argocd-apps/app-secrets.yaml",
      "kind: Application\nspec:\n  source:\n    path: infrastructure/app/secrets\n",
    ),
  ).toBe(true);
  expect(isAllowedSensitiveFile("secrets/api.yaml", "kind: Secret\n")).toBe(false);
});

test("rejects missing roles, invalid YAML, and malformed encrypted payloads", () => {
  expect(isAllowedSensitiveFile("secrets/README.md", undefined)).toBe(true);
  expect(isAllowedSensitiveFile("credentials.yaml", "kind: Secret\n")).toBe(false);
  expect(isAllowedSensitiveFile("secrets/app.enc.yaml", undefined)).toBe(false);
  expect(isAllowedSensitiveFile("secrets/app.enc.yaml", "kind: [\n")).toBe(false);
  expect(isAllowedSensitiveFile("secrets/app.enc.yaml", "---\n...\n")).toBe(false);
  expect(
    isAllowedSensitiveFile(
      "secrets/app.enc.yaml",
      encryptedSecret.replace("version: 3.9.0", "version: 3.9.0").replace("mac:", "badMac:"),
    ),
  ).toBe(false);
  expect(
    isAllowedSensitiveFile(
      "secrets/app.enc.yaml",
      encryptedSecret
        .replace("version: 3.9.0", "version: 3.9.0")
        .replace("kind: Secret", "kind: ConfigMap"),
    ),
  ).toBe(false);
  expect(
    isAllowedSensitiveFile(
      "secrets/app.enc.yaml",
      encryptedSecret.replace("version: 3.9.0", "version: 3.9.0").replace("data:\n", "data: {}\n"),
    ),
  ).toBe(false);
  expect(
    isAllowedSensitiveFile(
      "secrets/app.enc.yaml",
      encryptedSecret.replace("version: 3.9.0", "version: 3.9.0").replace("ciphertext", ""),
    ),
  ).toBe(false);
});

test("validates KSOPS and Kustomize metadata fields", () => {
  const generator = (apiVersion, kind, files) =>
    `apiVersion: ${apiVersion}\nkind: ${kind}\nfiles:\n${files}`;
  expect(
    isAllowedSensitiveFile(
      "infrastructure/app/secrets/ksops-generator.yaml",
      generator("viaduct.ai/v1", "ksops", "  - secret.enc.yaml\n"),
    ),
  ).toBe(true);
  for (const source of [
    generator("other/v1", "ksops", "  - secret.enc.yaml\n"),
    generator("viaduct.ai/v1", "Other", "  - secret.enc.yaml\n"),
    generator("viaduct.ai/v1", "ksops", "  - secret.yaml\n"),
    "apiVersion: viaduct.ai/v1\nkind: ksops\nfiles: []\n",
    "apiVersion: viaduct.ai/v1\nkind: ksops\nfiles: 3\n",
  ]) {
    expect(isAllowedSensitiveFile("infrastructure/app/secrets/ksops-generator.yaml", source)).toBe(
      false,
    );
  }

  const kustomization = "kind: Kustomization\ngenerators:\n  - ksops-generator.yaml\n";
  expect(
    isAllowedSensitiveFile("infrastructure/app/secrets/kustomization.yaml", kustomization),
  ).toBe(true);
  for (const source of [
    "kind: Other\ngenerators:\n  - ksops-generator.yaml\n",
    "kind: Kustomization\ngenerators: []\n",
    "kind: Kustomization\ngenerators: ksops-generator.yaml\n",
    "kind: Kustomization\ngenerators:\n  - secrets.yaml\n",
  ]) {
    expect(isAllowedSensitiveFile("infrastructure/app/secrets/kustomization.yaml", source)).toBe(
      false,
    );
  }
});

test("accepts Argo CD secret Applications from either source form", () => {
  expect(
    isAllowedSensitiveFile(
      "clusters/prod/argocd-apps/app-secrets.yaml",
      "kind: Application\nspec:\n  sources:\n    - path: infrastructure/app/secrets\n",
    ),
  ).toBe(true);
  expect(
    isAllowedSensitiveFile(
      "clusters/prod/argocd-apps/cilium-secrets.yaml",
      "kind: Application\nspec:\n  source:\n    path: infrastructure/cilium-secrets\n",
    ),
  ).toBe(true);
  expect(
    isAllowedSensitiveFile(
      "clusters/prod/argocd-apps/app-secrets.yaml",
      "kind: Application\nspec:\n  source:\n    path: infrastructure/app/workloads\n",
    ),
  ).toBe(false);
  expect(
    isAllowedSensitiveFile(
      "clusters/prod/argocd-apps/app-secrets.yaml",
      "kind: ConfigMap\nspec:\n  source:\n    path: infrastructure/app/secrets\n",
    ),
  ).toBe(false);
});

test("allows SOPS-encrypted Kubernetes Secret lists", () => {
  const list = encryptedSecret
    .replace("kind: Secret", "kind: ENC[AES256_GCM,data:list,iv:iv,tag:tag,type:str]")
    .replace(
      "data:\n  token: ENC[AES256_GCM,data:ciphertext,iv:iv,tag:tag,type:str]",
      "items:\n  - kind: ENC[AES256_GCM,data:secret,iv:iv,tag:tag,type:str]\n    data:\n      token: ENC[AES256_GCM,data:ciphertext,iv:iv,tag:tag,type:str]",
    );
  expect(isAllowedSensitiveFile("secrets/cilium.enc.yaml", list)).toBe(true);
  expect(
    isAllowedSensitiveFile(
      "secrets/cilium.enc.yaml",
      list.replace("ENC[AES256_GCM,data:ciphertext,iv:iv,tag:tag,type:str]", "plaintext-value"),
    ),
  ).toBe(false);
  expect(
    isAllowedSensitiveFile(
      "secrets/cilium.enc.yaml",
      list.replace("  - kind:", "  - null\n  - kind:"),
    ),
  ).toBe(false);
});
