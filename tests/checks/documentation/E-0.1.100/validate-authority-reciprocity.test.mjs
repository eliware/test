import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityReciprocity } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-reciprocity.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("validates repository identity and reciprocal map links", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reciprocity-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "authority-map.json");
  await writeFile(file, "{}\n");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({
      repositoryId: "eliware/example",
      globalAuthorityMap: "../authority-map.json",
      subjects: [{ id: "example.subject" }],
    }),
  );
  await expect(
    validateAuthorityReciprocity({
      root,
      file,
      entries: [
        null,
        "invalid",
        {
          repository: "eliware/example",
          authorityFile: "./specs/authority.json",
          governs: ["example.subject"],
        },
      ],
    }),
  ).resolves.toBeNull();
});

test("rejects mismatched repository identities", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reciprocity-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "authority-map.json");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({ repositoryId: "other/repository", subjects: [] }),
  );
  await expect(
    validateAuthorityReciprocity({
      root,
      file,
      entries: [
        { repository: "eliware/example", authorityFile: "./specs/authority.json", governs: [] },
      ],
    }),
  ).resolves.toContain("does not match");
});

test("rejects governs targets missing from the local authority record", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reciprocity-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "authority-map.json");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({ repositoryId: "eliware/example", subjects: [{ id: "known.subject" }] }),
  );
  await expect(
    validateAuthorityReciprocity({
      root,
      file,
      entries: [
        {
          repository: "eliware/example",
          authorityFile: "./specs/authority.json",
          governs: ["missing.subject"],
        },
      ],
    }),
  ).resolves.toContain("does not resolve to a local subject");
});

test("shares parsed authority documents with the inventory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reciprocity-inventory-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "authority-map.json");
  await writeFile(file, "{}\n");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({
      repositoryId: "eliware/example",
      globalAuthorityMap: "../authority-map.json",
      subjects: [],
    }),
  );
  const inventory = createRepositoryInventory(root);

  await expect(
    validateAuthorityReciprocity({
      root,
      file,
      entries: [
        { repository: "eliware/example", authorityFile: "./specs/authority.json", governs: [] },
      ],
      inventory,
    }),
  ).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reports missing authority targets, missing reciprocal maps, and mismatched return links", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reciprocity-errors-"));
  await mkdir(join(root, "specs"));
  const file = join(root, "authority-map.json");
  await writeFile(file, "{}\n");

  await expect(
    validateAuthorityReciprocity({
      root,
      file,
      entries: [{ repository: "eliware/example", authorityFile: "./missing.json" }],
    }),
  ).resolves.toContain("does not resolve");

  const authorityFile = join(root, "specs", "authority.json");
  await writeFile(
    authorityFile,
    JSON.stringify({ repositoryId: "eliware/example", globalAuthorityMap: "../missing-map.json" }),
  );
  await expect(
    validateAuthorityReciprocity({
      root,
      file,
      entries: [{ repository: "eliware/example", authorityFile: "./specs/authority.json" }],
    }),
  ).resolves.toContain("globalAuthorityMap does not resolve");

  await writeFile(join(root, "other-map.json"), "{}\n");
  await writeFile(
    authorityFile,
    JSON.stringify({ repositoryId: "eliware/example", globalAuthorityMap: "../other-map.json" }),
  );
  await expect(
    validateAuthorityReciprocity({
      root,
      file,
      entries: [{ repository: "eliware/example", authorityFile: "./specs/authority.json" }],
    }),
  ).resolves.toContain("does not point back to authority-map.json");

  await writeFile(authorityFile, JSON.stringify({ repositoryId: "eliware/example" }));
  await expect(
    validateAuthorityReciprocity({
      root,
      file,
      entries: [{ repository: "eliware/example", authorityFile: "./specs/authority.json" }],
    }),
  ).resolves.toContain("must declare globalAuthorityMap");
  await rm(root, { recursive: true, force: true });
});

test("skips reciprocity checks for authority documents unavailable outside the checkout", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-reciprocity-external-"));
  const result = await validateAuthorityReciprocity({
    root,
    file: join(root, "authority-map.json"),
    entries: [
      { repository: "eliware/external", authorityFile: "../external/specs/authority.json" },
    ],
  });

  expect(result).toBeNull();
  await rm(root, { recursive: true, force: true });
});
