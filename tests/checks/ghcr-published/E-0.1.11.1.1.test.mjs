import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
  ghcrPackage,
} from "../../../test-fixtures/ghcr-workflow.mjs";
import { ruleId, run } from "../../../src/checks/ghcr-published/E-0.1.11.1.1.mjs";

const validate = (workflow, options = {}) =>
  run({
    repositoryInventory: createGhcrInventory({ workflow, ...options }),
    packageJson: ghcrPackage,
  });

test("accepts the root image build, GHCR permissions, and version tag", async () => {
  await expect(validate(createGhcrWorkflow())).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("rejects missing workflow inventory", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});

test("requires the root Dockerfile and valid package image name", async () => {
  await expect(
    validate(createGhcrWorkflow(), { files: ["AGENTS.md", ".github/workflows/publish.yaml"] }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("root must contain Dockerfile"),
  });
  await expect(
    run({
      repositoryInventory: createGhcrInventory(),
      packageJson: { ...ghcrPackage, name: "@eliware/Bad_Name" },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("unscoped package name") });
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
  [(flow) => (flow.jobs.publish.steps[1].if = "false"), "run unconditionally"],
  [(flow) => flow.jobs.publish.steps.splice(1, 1), "must build and push an image"],
  [(flow) => (flow.jobs.publish.steps[1].uses = "docker/build-push-action@v5"), "action v6"],
  [(flow) => (flow.jobs.publish.steps[1].with.context = "src"), "root context"],
  [(flow) => (flow.jobs.publish.steps[1].with.file = "Dockerfile.dev"), "root context"],
  [(flow) => (flow.jobs.publish.steps[1].with.push = false), "root context"],
  [
    (flow) => (flow.jobs.publish.steps[1].with.tags = ["ghcr.io/other/example:v12.0.0"]),
    "image tags",
  ],
  [
    (flow) => (flow.jobs.publish.steps[1].with.tags = ["ghcr.io/eliware/example:v11.0.0"]),
    "image tags",
  ],
  [
    (flow) => (flow.jobs.publish.steps[1].with.tags = ["ghcr.io/other/example:latest"]),
    "image tags",
  ],
  [(flow) => (flow.on.push.tags = ["main"]), "version tags"],
  [(flow) => ((flow.on = undefined), (flow.true = { push: { tags: ["main"] } })), "version tags"],
  [
    (flow) => flow.jobs.publish.steps.push({ run: "kubectl apply -f app.yaml" }),
    "deployment commands",
  ],
])("rejects invalid GHCR workflow settings", async (change, message) => {
  const workflow = createGhcrWorkflow();
  change(workflow);
  await expect(validate(workflow)).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining(message),
  });
});

test("permits additional tags that use the same image name", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[1].with.tags.push("ghcr.io/eliware/example:latest");
  await expect(validate(workflow)).resolves.toMatchObject({ status: "pass" });
});

test("accepts image tags as a multiline string", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[1].with.tags = "ghcr.io/eliware/example:v12.0.0\n";
  await expect(validate(workflow)).resolves.toMatchObject({ status: "pass" });
});
