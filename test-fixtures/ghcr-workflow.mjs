import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  releaseTagFilter,
  releaseTagGuard,
} from "../src/checks/ghcr-published/release-version-tag.mjs";
import {
  npm12InstallCommand,
  npm12VersionCheckCommand,
} from "../src/checks/general/E-0.1/E-0.1.24/validate-npm12-workflow-setup.mjs";

const agents = "GHCR image visibility publication workflow provenance deployment managed image.";
const validationSteps = `      - uses: actions/setup-node@v7
        with:
          node-version: 26
      - run: ${npm12InstallCommand}
      - run: >-
          ${npm12VersionCheckCommand}
      - run: npm ci
      - run: npm test`;
const validation = `name: validation
on:
  push:
  pull_request:
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
${validationSteps}
`;
const publication = `name: publish
on:
  push:
    tags: ["${releaseTagFilter}"]
permissions:
  contents: read
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
${validationSteps}
  publish:
    needs: validate
    permissions:
      contents: read
      packages: write
      id-token: write
      attestations: write
      artifact-metadata: write
    runs-on: ubuntu-latest
    environment: ghcr-publish
    if: startsWith(github.ref, 'refs/tags/v')
    env:
      RELEASE_REF: refs/tags/v1.2.3
    steps:
      - uses: actions/checkout@v6
      - id: release-version-check
        run: '${releaseTagGuard}'
      - id: push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ghcr.io/eliware/example:v1.2.3
      - uses: actions/attest@v4
        with:
          subject-name: ghcr.io/eliware/example
          subject-digest: \${{ steps.push.outputs.digest }}
          push-to-registry: true
      - run: test "$(docker buildx imagetools inspect ghcr.io/eliware/example:v1.2.3 --format '{{.Manifest.Digest}}')" = "\${{ steps.push.outputs.digest }}"
      - run: docker buildx imagetools inspect ghcr.io/eliware/example@\${{ steps.push.outputs.digest }}
      - run: gh attestation verify oci://ghcr.io/eliware/example@\${{ steps.push.outputs.digest }} --repo \${{ github.repository }}
      - run: echo verified \${{ steps.push.outputs.digest }} >> "$GITHUB_STEP_SUMMARY"
`;

export async function createGhcrFixture() {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ghcr-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, "AGENTS.md"), agents);
  await writeFile(join(root, "Dockerfile"), "FROM node:26\n");
  await writeFile(join(root, ".github", "workflows", "ci.yaml"), validation);
  await writeFile(join(root, ".github", "workflows", "publish.yaml"), publication);
  return { root, publicationPath: join(root, ".github", "workflows", "publish.yaml") };
}
