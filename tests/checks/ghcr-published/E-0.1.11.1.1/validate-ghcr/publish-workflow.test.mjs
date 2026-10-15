import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
  ghcrPackage,
} from "../../../../../test-fixtures/ghcr-workflow.mjs";
import { validateGhcrPublishWorkflow } from "../../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr/publish-workflow.mjs";

test("validates the GHCR workflow profile requirements", async () => {
  await expect(validateGhcrPublishWorkflow(createGhcrInventory(), ghcrPackage)).resolves.toEqual(
    [],
  );
});

test.each([
  [{ name: "@eliware/application-template", version: "12.0.4" }],
  [{ name: "@eliware/web-template", version: "12.0.9" }],
  [{ name: "@eliware/discord-template", version: "12.0.12" }],
])("accepts the same workflow for package identity and version %s", async (packageJson) => {
  await expect(validateGhcrPublishWorkflow(createGhcrInventory(), packageJson)).resolves.toEqual(
    [],
  );
});

test("reports a missing workflow file", async () => {
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ files: ["Dockerfile"] }), ghcrPackage),
  ).resolves.toContain(".github/workflows/publish.yaml is required.");
});

test("requires the root Dockerfile and a valid package image name", async () => {
  await expect(
    validateGhcrPublishWorkflow(
      createGhcrInventory({ files: ["AGENTS.md", ".github/workflows/publish.yaml"] }),
      ghcrPackage,
    ),
  ).resolves.toContain("Repository root must contain Dockerfile.");
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory(), {
      ...ghcrPackage,
      name: "@eliware/Bad_Name",
    }),
  ).resolves.toContain("GHCR image name must use the unscoped package name.");
});

test.each([
  [(flow) => (flow.jobs.publish.environment = "other"), "ghcr-publish environment"],
  [(flow) => (flow.jobs.publish["runs-on"] = "windows-latest"), "must run on Ubuntu"],
  [(flow) => (flow.jobs.publish.if = "false"), "bypass conditions"],
  [(flow) => (flow.jobs.publish["continue-on-error"] = true), "bypass conditions"],
  [(flow) => (flow.permissions = { contents: "write" }), "workflow permissions"],
  [(flow) => (flow.jobs.publish.permissions.packages = "read"), "required read, package"],
  [(flow) => (flow.jobs.publish.steps[0].uses = "actions/checkout@v5"), "checkout v6 once"],
  [(flow) => flow.jobs.publish.steps.push({ uses: "actions/checkout@v6" }), "checkout v6 once"],
  [(flow) => (flow.jobs.publish.steps[2].if = "false"), "run unconditionally"],
  [(flow) => flow.jobs.publish.steps.splice(2, 1), "must build and push an image"],
  [(flow) => (flow.jobs.publish.steps[2].uses = "docker/build-push-action@v5"), "action v6"],
  [(flow) => (flow.jobs.publish.steps[2].with.context = "src"), "root context"],
  [(flow) => (flow.jobs.publish.steps[2].with.file = "Dockerfile.dev"), "root context"],
  [(flow) => (flow.jobs.publish.steps[2].with.push = false), "root context"],
  [(flow) => (flow.jobs.publish.env.IMAGE_NAME = "ghcr.io/other/example"), "derive IMAGE_NAME"],
  [
    (flow) =>
      (flow.jobs.publish.steps[2].with.tags = ["ghcr.io/other/example:${{ github.ref_name }}"]),
    "IMAGE_NAME and the release tag",
  ],
  [
    (flow) => (flow.jobs.publish.steps[2].with.tags = ["${{ env.IMAGE_NAME }}:v13.0.0"]),
    "IMAGE_NAME and the release tag",
  ],
  [
    (flow) => (flow.jobs.publish.steps[2].with.tags = ["${{ env.IMAGE_NAME }}:${{ github.sha }}"]),
    "IMAGE_NAME and the release tag",
  ],
  [(flow) => (flow.on.push.tags = ["main"]), "version tags"],
  [(flow) => ((flow.on = undefined), (flow.true = { push: { tags: ["main"] } })), "version tags"],
  [
    (flow) => flow.jobs.publish.steps.push({ run: "kubectl apply -f app.yaml" }),
    "deployment commands",
  ],
])("rejects invalid workflow settings: %s", async (change, message) => {
  const workflow = createGhcrWorkflow();
  change(workflow);
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toEqual(expect.arrayContaining([expect.stringContaining(message)]));
});

test("reports an image tag outside the package image", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[2].with.tags = "ghcr.io/other/image:${{ github.ref_name }}";
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toContain("GHCR image tags must use IMAGE_NAME and the release tag.");
});

test("requires an unconditional version tag guard before the image push", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps.splice(1, 1);
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toContain(
    "GHCR publisher must guard publication with the canonical package version tag.",
  );
});

test("rejects a guard that does not compare the release tag to the package version", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[1].run = workflow.jobs.publish.steps[1].run.replace(
    "GITHUB_REF_NAME!=='v'+version",
    "GITHUB_REF_NAME==='v'+version",
  );
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toContain(
    "GHCR publisher must guard publication with the canonical package version tag.",
  );
});

test("rejects missing workflow sections and incomplete publisher data", async () => {
  const workflow = createGhcrWorkflow();
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow: {} }), ghcrPackage),
  ).resolves.toEqual(
    expect.arrayContaining([
      "GHCR publish job must use the ghcr-publish environment.",
      "GHCR publish job must run on Ubuntu.",
    ]),
  );
  delete workflow.jobs.publish.steps;
  await expect(validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), {})).resolves.toEqual(
    expect.arrayContaining([
      "GHCR image name must use the unscoped package name.",
      "GHCR publisher must use checkout v6 once.",
      "GHCR publisher must build and push an image.",
    ]),
  );
});

test("rejects missing image tag values", async () => {
  const workflow = createGhcrWorkflow();
  delete workflow.jobs.publish.steps[2].with.tags;
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toContain("GHCR image tags must use IMAGE_NAME and the release tag.");
});

test("permits additional tags that use the same image name", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[2].with.tags += "\n${{ env.IMAGE_NAME }}:latest";
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toEqual([]);
});

test("accepts image tags as a multiline string", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[2].with.tags += "\n${{ env.IMAGE_NAME }}:latest\n";
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toEqual([]);
});
