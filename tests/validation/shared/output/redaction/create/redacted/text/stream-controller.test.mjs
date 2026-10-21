import { expect, test } from "@jest/globals";
import { createRedactedStreamPolicy } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/policy.mjs";
import { createRedactedTextStreamController } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/text/stream-controller.mjs";

test("composes a UTF-8 decoder with the redacted stream buffer", () => {
  const policy = createRedactedStreamPolicy([], 100);
  const controller = createRedactedTextStreamController(policy, 100);
  expect(controller.push(Buffer.from([0xf0, 0x9f]))).toBe("");
  const output = controller.push(Buffer.from([0x8c, 0xad])) + controller.finish();
  expect(output).toBe("🌭");
});
