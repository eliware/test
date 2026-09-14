import { expect, test } from "@jest/globals";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityRecord } from "../../../../src/checks/documentation/E-1.100/validate-authority-record.mjs";

test("validates authority record subjects and references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-record-"));
  const file = join(root, "specs", "authority.json");
  await expect(
    validateAuthorityRecord({
      root,
      file,
      document: {
        repositoryId: "eliware/example",
        globalAuthorityMap: "../../docs/authority-map.json",
        subjects: [
          {
            id: "example.subject",
            kind: "specification",
            authority: { path: "../../external/directives.json" },
            directives: [{ path: "../../external/directives.json" }],
            implementation: [{ path: "../../src" }],
            consumers: ["example consumers"],
            reviewers: ["example reviewers"],
            evidence: [],
            status: "active",
          },
        ],
      },
    }),
  ).resolves.toBeNull();
  await expect(validateAuthorityRecord({ root, file, document: {} })).resolves.toContain("subjects array");
});
