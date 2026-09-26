import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function createJestCoverageDirectory() {
  return join(tmpdir(), "eliware-test", `coverage-${randomUUID()}`);
}
