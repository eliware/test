import { expect, jest, test } from "@jest/globals";
import { createRedactedTextStreamSession } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/text/session.mjs";

function setup(initiallySuppressed = false) {
  const addText = jest.fn((text) => `redacted:${text}`);
  const finish = jest.fn(() => "final");
  const createBuffer = jest.fn(() => ({ addText, finish }));
  const decoder = { write: jest.fn(() => "decoded") };
  const output = { append: jest.fn(), canContinue: jest.fn(() => true) };
  const policy = {
    suppressed: initiallySuppressed,
    pendingLimit: 12,
    findSafeBoundary: jest.fn(),
    trimSuffix: jest.fn(),
  };
  const session = createRedactedTextStreamSession(policy, decoder, output, 50, createBuffer);
  return { addText, createBuffer, decoder, finish, output, policy, session };
}

test("builds the stream buffer with policy and output controls", () => {
  const { createBuffer, output, policy } = setup();
  expect(createBuffer).toHaveBeenCalledWith(
    expect.objectContaining({
      pendingLimit: 12,
      bufferLimit: 50,
      decoder: expect.any(Object),
      findSafeBoundary: policy.findSafeBoundary,
      trimSuffix: policy.trimSuffix,
      append: output.append,
      canContinue: expect.any(Function),
      suppress: expect.any(Function),
    }),
  );
});

test("decodes chunks and owns push and finish lifecycle", () => {
  const { addText, decoder, finish, session } = setup();
  expect(session.push("input")).toBe("redacted:decoded");
  expect(decoder.write).toHaveBeenCalledWith(Buffer.from("input"));
  expect(addText).toHaveBeenCalledWith("decoded");
  expect(session.finish()).toBe("final");
  expect(session.finish()).toBe("");
  expect(session.push("after finish")).toBe("");
  expect(finish).toHaveBeenCalledTimes(1);
});

test("stops pushes after stream suppression", () => {
  const { createBuffer, decoder, session } = setup();
  const options = createBuffer.mock.calls[0][0];
  options.suppress();
  expect(session.suppressed).toBe(true);
  expect(options.canContinue()).toBe(false);
  expect(session.push("secret input")).toBe("");
  expect(decoder.write).not.toHaveBeenCalled();
});

test("ignores pushes when the policy starts suppressed", () => {
  const { decoder, session } = setup(true);
  expect(session.push("input")).toBe("");
  expect(decoder.write).not.toHaveBeenCalled();
});
