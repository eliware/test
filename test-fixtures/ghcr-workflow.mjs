import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const agents = "GHCR image visibility publication workflow provenance deployment managed image.";
const validation =
  "name: validation\non:\n  push:\n  pull_request:\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n";
const publication = `name: publish
on:
  push:
    tags: ["v[0-9]+.[0-9]+.[0-9]+"]
permissions:
  contents: read
  packages: write
  id-token: write
  attestations: write
  artifact-metadata: write
jobs:
  publish:
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    env:
      RELEASE_REF: refs/tags/v1.2.3
    steps:
      - uses: actions/checkout@v6
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
  await writeFile(join(root, ".github", "workflows", "validation.yml"), validation);
  await writeFile(join(root, ".github", "workflows", "publish.yml"), publication);
  return { root, publicationPath: join(root, ".github", "workflows", "publish.yml") };
}
