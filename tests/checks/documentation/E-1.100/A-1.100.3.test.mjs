import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/documentation/E-1.100/A-1.100.3.mjs";

test("validates local structured references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-refs-"));
  await mkdir(join(root, "specs"));
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({
      repositoryId: "eliware/example",
      globalAuthorityMap: "../../docs/map.json",
      subjects: [],
    }),
  );
  await writeFile(join(root, "specs", "index.json"), JSON.stringify({ path: "./authority.json" }));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "node_modules", "metadata.json"), "{}");
  await writeFile(join(root, "notes.txt"), "not a documentation surface");
  await writeFile(
    join(root, "README.md"),
    "# Heading\n\n[Authority](specs/authority.json) [External](https://example.test) [Anchor](#heading) [Outside](../../outside.md)",
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.3",
    status: "fail",
    message: expect.stringContaining("escapes the repository"),
  });
  await writeFile(join(root, "README.md"), "[Missing](specs/missing.json)");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("missing.json") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("validates an available authority registry and reciprocal authority record", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-authority-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "README.md"), "# Example");
  await writeFile(join(root, "package.json"), "{}");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({
      repositoryId: "eliware/example",
      globalAuthorityMap: "../authority-map.json",
      subjects: [
        {
          id: "example.subject",
          kind: "specification",
          authority: { path: "./authority.json" },
          directives: [{ path: "../README.md" }],
          implementation: [{ path: "../README.md" }],
          consumers: [],
          reviewers: [],
          evidence: [],
          status: "active",
        },
      ],
    }),
  );
  await writeFile(
    join(root, "authority-map.json"),
    JSON.stringify({
      repositoryRegistry: [
        {
          repository: "eliware/example",
          path: ".",
          package: "./package.json",
          authorityFile: "./specs/authority.json",
          reference: "./README.md",
          governs: ["example.subject"],
          directiveNamespaces: ["E-1"],
        },
      ],
      crosslinks: [],
      structuredDocuments: [],
    }),
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.3",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects an authority registry whose reciprocal identity differs", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-authority-mismatch-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "README.md"), "# Example");
  await writeFile(join(root, "package.json"), "{}");
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({
      repositoryId: "other/repo",
      globalAuthorityMap: "../authority-map.json",
      subjects: [
        {
          id: "example.subject",
          kind: "specification",
          authority: { path: "./authority.json" },
          directives: [{ path: "../README.md" }],
          implementation: [{ path: "../README.md" }],
          consumers: [],
          reviewers: [],
          evidence: [],
          status: "active",
        },
      ],
    }),
  );
  await writeFile(
    join(root, "authority-map.json"),
    JSON.stringify({
      repositoryRegistry: [
        {
          repository: "eliware/example",
          path: ".",
          package: "./package.json",
          authorityFile: "./specs/authority.json",
          reference: "./README.md",
          governs: ["example.subject"],
          directiveNamespaces: ["E-1"],
        },
      ],
    }),
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("does not match") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports an inaccessible documentation root as a validation failure", async () => {
  await expect(run({ root: join(tmpdir(), "eliware-missing-doc-root") })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("Documentation reference validation failed"),
    }),
  );
});
