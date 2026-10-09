import { validatePublishWorkflowOrder } from "../../../../src/checks/shared/E-0.1.0.1.7/validate-publish-workflow-order.mjs";

const validPublish = `jobs:
  validate:
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v7
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm test
  publish:
    needs: validate
    steps: []`;

function inventory(source = validPublish, files = [".github/workflows/publish.yaml"]) {
  return { files: async () => files, readText: async () => source };
}

const packageJson = { eliware: { apply: ["npm-published", "ghcr-published"] } };

test("skips publication ordering when no publication profile applies", async () => {
  await expect(validatePublishWorkflowOrder(inventory(), {})).resolves.toEqual([]);
});

test("requires an inspectable inventory and publish workflow", async () => {
  await expect(validatePublishWorkflowOrder({}, packageJson)).resolves.toEqual([
    "publish.yaml could not be inspected.",
  ]);
  await expect(validatePublishWorkflowOrder(inventory("", []), packageJson)).resolves.toEqual([
    ".github/workflows/publish.yaml is required.",
  ]);
});

test("rejects invalid and multiple YAML documents", async () => {
  await expect(validatePublishWorkflowOrder(inventory("jobs: ["), packageJson)).resolves.toEqual([
    ".github/workflows/publish.yaml must contain one valid YAML document.",
  ]);
  await expect(
    validatePublishWorkflowOrder(inventory(`${validPublish}\n---\njobs: {}`), packageJson),
  ).resolves.toEqual([".github/workflows/publish.yaml must contain one valid YAML document."]);
});

test("reports read failures", async () => {
  await expect(
    validatePublishWorkflowOrder(
      {
        files: async () => [".github/workflows/publish.yaml"],
        readText: async () => {
          throw new Error("offline");
        },
      },
      packageJson,
    ),
  ).resolves.toEqual([".github/workflows/publish.yaml could not be inspected: offline"]);
});

test("requires validate before publish and a validation dependency", async () => {
  const reversed = validPublish
    .replace("  validate:", "  temp:")
    .replace("  publish:", "  validate:")
    .replace("  temp:", "  publish:");
  await expect(validatePublishWorkflowOrder(inventory(reversed), packageJson)).resolves.toContain(
    "publish.yaml jobs must list validate before publish.",
  );
  await expect(
    validatePublishWorkflowOrder(
      inventory(validPublish.replace("needs: validate", "needs: other")),
      packageJson,
    ),
  ).resolves.toContain("publish.yaml publish job must depend on validate.");
  await expect(
    validatePublishWorkflowOrder(
      inventory(validPublish.replace("needs: validate", "needs: [validate]")),
      packageJson,
    ),
  ).resolves.toEqual([]);
  await expect(
    validatePublishWorkflowOrder(inventory("name: Publish"), packageJson),
  ).resolves.toEqual(
    expect.arrayContaining([expect.stringContaining("jobs must list validate before publish")]),
  );
});

test("requires the ordered validation steps and a final npm test", async () => {
  await expect(
    validatePublishWorkflowOrder(
      inventory("jobs:\n  validate: {}\n  publish:\n    needs: validate"),
      packageJson,
    ),
  ).resolves.toEqual(
    expect.arrayContaining([
      expect.stringContaining("publish.yaml validate job must define steps"),
    ]),
  );
  await expect(
    validatePublishWorkflowOrder(
      inventory(
        validPublish.replace("      - run: npm ci", "      - run: npm test\n      - run: npm ci"),
      ),
      packageJson,
    ),
  ).resolves.toEqual(
    expect.arrayContaining([expect.stringContaining("publish.yaml validate steps must order")]),
  );
  await expect(
    validatePublishWorkflowOrder(
      inventory(
        validPublish.replace(
          "      - run: npm test\n  publish:",
          "      - run: npm test\n      - run: echo done\n  publish:",
        ),
      ),
      packageJson,
    ),
  ).resolves.toEqual(
    expect.arrayContaining([
      expect.stringContaining("publish.yaml npm test must end the validate job"),
    ]),
  );
  await expect(
    validatePublishWorkflowOrder(
      inventory(validPublish.replace("      - run: npm test\n", "")),
      packageJson,
    ),
  ).resolves.toEqual(
    expect.arrayContaining([expect.stringContaining("publish.yaml validate steps must order")]),
  );
});

test("accepts the shared validation and publication job order", async () => {
  await expect(validatePublishWorkflowOrder(inventory(), packageJson)).resolves.toEqual([]);
  await expect(
    validatePublishWorkflowOrder(
      inventory(
        validPublish.replace(
          "      - run: npm ci",
          "      - run: echo 'ready'\n      - run: npm ci",
        ),
      ),
      packageJson,
    ),
  ).resolves.toEqual([]);
  await expect(
    validatePublishWorkflowOrder(
      inventory(
        validPublish.replace(
          "      - run: npm test",
          "      - run: echo 'late'\n      - run: npm test",
        ),
      ),
      packageJson,
    ),
  ).resolves.toEqual(
    expect.arrayContaining([expect.stringContaining("npm ci must be followed by npm test")]),
  );
});
