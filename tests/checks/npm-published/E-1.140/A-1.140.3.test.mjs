import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/npm-published/E-1.140/A-1.140.3.mjs";

test("requires validation before publication", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    `jobs:
  validate:
    steps:
      - run: npm ci
      - run: npm test
      - run: npm test
  publish:
    needs: validate
    steps:
      - run: npm publish
`,
  );
  expect((await run({ root })).status).toBe("pass");
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    `jobs:
  validate:
    steps:
      - run: npm ci
      - run: npm test
  publish:
    steps:
      - run: npm publish
`,
  );
  expect((await run({ root })).status).toBe("fail");
});

test("passes when workflows are unavailable or have no publication", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-publish-gate-missing-"));
  await expect(run({ root: missing })).resolves.toEqual({ ruleId: "A-1.140.3", status: "pass", message: "" });
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-gate-ci-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "name: ci\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.140.3", status: "pass", message: "" });
});

test("rejects publication without a validation job or matching needs", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-gate-invalid-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    `jobs:
  validate:
    steps:
      - run: npm ci
      - run: npm test
  publish:
    needs: [other]
    steps:
      - run: npm publish
`,
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `jobs:
  validate:
    steps:
      - run: npm ci
      - run: npm test
  publish:
    needs: null
    steps:
      - run: npm publish
`);
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("reports unparseable publication workflows and missing needs", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-gate-parse-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), "npm publish\n");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ message: "Publication workflow could not be parsed: publish.yml." }),
  );
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `jobs:
  validate:
    steps:
      - run: npm ci
      - run: npm test
  publish:
    steps:
      - run: npm publish
`);
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});
