import { stringify } from "yaml";
import { packageVersion } from "../tests/helpers/project-version.mjs";

export const ghcrPackage = { name: "@eliware/example", version: packageVersion };

export const ghcrAgents = [
  "## GHCR publication",
  "Image: ghcr.io/eliware/example",
  `Pull command: docker pull ghcr.io/eliware/example:v${packageVersion}`,
  "Supported tags: vMAJOR.MINOR.PATCH",
  "Deployment boundary: publication does not deploy; deploy by immutable version tag and recorded sha256 digest.",
].join("\n");

export function createGhcrWorkflow() {
  const digest = "${{ steps.image.outputs.digest }}";
  return {
    name: "Publish",
    on: { push: { tags: ["v[0-9]*.[0-9]*.[0-9]*"] } },
    permissions: { contents: "read" },
    jobs: {
      publish: {
        needs: "validate",
        "runs-on": "ubuntu-latest",
        environment: "ghcr-publish",
        env: { IMAGE_NAME: "ghcr.io/${{ github.repository }}" },
        permissions: {
          contents: "read",
          packages: "write",
          "id-token": "write",
          attestations: "write",
          "artifact-metadata": "write",
        },
        steps: [
          { uses: "actions/checkout@v7" },
          {
            run: `node -e "const version=require('./package.json').version;\nif(process.env.GITHUB_REF_NAME!=='v'+version)process.exit(1)"`,
          },
          {
            id: "image",
            uses: "docker/build-push-action@v6",
            with: {
              context: ".",
              file: "./Dockerfile",
              push: true,
              tags: "${{ env.IMAGE_NAME }}:${{ github.ref_name }}",
            },
          },
          {
            uses: "actions/attest@v4",
            with: {
              "subject-name": "${{ env.IMAGE_NAME }}",
              "subject-digest": digest,
              "push-to-registry": true,
            },
          },
          {
            run: `test "$(docker buildx imagetools inspect "$IMAGE_NAME:$GITHUB_REF_NAME" --format '{{.Manifest.Digest}}')" = "${digest}"`,
          },
          { run: `docker buildx imagetools inspect "$IMAGE_NAME@${digest}"` },
          {
            env: { GH_TOKEN: "${{ github.token }}" },
            run: `gh attestation verify "oci://$IMAGE_NAME@${digest}" --repo "\${{ github.repository }}"`,
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
