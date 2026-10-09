import { stringify } from "yaml";

export const ghcrPackage = { name: "@eliware/example", version: "12.0.0" };

export const ghcrAgents = [
  "## GHCR publication",
  "Image: ghcr.io/eliware/example",
  "Pull command: docker pull ghcr.io/eliware/example:v12.0.0",
  "Supported tags: vMAJOR.MINOR.PATCH",
  "Deployment boundary: publication does not deploy; deploy by immutable version tag and recorded sha256 digest.",
].join("\n");

export function createGhcrWorkflow() {
  const image = "ghcr.io/eliware/example";
  const digest = "${{ steps.push.outputs.digest }}";
  return {
    name: "Publish",
    on: { push: { tags: ["v[0-9]*.[0-9]*.[0-9]*"] } },
    permissions: { contents: "read" },
    jobs: {
      publish: {
        needs: "validate",
        "runs-on": "ubuntu-latest",
        environment: "ghcr-publish",
        permissions: {
          contents: "read",
          packages: "write",
          "id-token": "write",
          attestations: "write",
          "artifact-metadata": "write",
        },
        steps: [
          { uses: "actions/checkout@v6" },
          {
            id: "push",
            uses: "docker/build-push-action@v6",
            with: {
              context: ".",
              file: "./Dockerfile",
              push: true,
              tags: [`${image}:v12.0.0`],
            },
          },
          {
            uses: "actions/attest@v4",
            with: {
              "subject-name": image,
              "subject-digest": digest,
              "push-to-registry": true,
            },
          },
          {
            run: `test "$(docker buildx imagetools inspect ${image}:v12.0.0 --format '{{.Manifest.Digest}}')" = "${digest}"`,
          },
          { run: `docker buildx imagetools inspect ${image}@${digest}` },
          {
            run: `gh attestation verify oci://${image}@${digest} --repo \${{ github.repository }}`,
          },
          { run: `echo "${digest}" >> "$GITHUB_STEP_SUMMARY"` },
        ],
      },
    },
  };
}

export function createGhcrInventory({
  workflow = createGhcrWorkflow(),
  files = ["Dockerfile", "AGENTS.md", ".github/workflows/publish.yaml"],
  agents = ghcrAgents,
  dockerfile = "FROM node:26\n",
} = {}) {
  return {
    files: async () => files,
    readText: async (path) => {
      if (path === "AGENTS.md") return agents;
      if (path === "Dockerfile") return dockerfile;
      if (path === ".github/workflows/publish.yaml") return stringify(workflow);
      throw new Error(`unexpected path: ${path}`);
    },
  };
}
