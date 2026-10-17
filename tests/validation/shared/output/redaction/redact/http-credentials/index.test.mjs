import { expect, test } from "@jest/globals";
import { redactHttpCredentials } from "../../../../../../../src/validation/shared/output/redaction/redact/http-credentials/index.mjs";

test("redacts credential formats together and leaves ordinary output unchanged", () => {
  const output = redactHttpCredentials(
    "Authorization: Bearer secret https://user:pass@example.test/?token=private\nx-api-key: key\nCookie: session=value",
  );
  expect(output).not.toMatch(/secret|user:pass|token=private|x-api-key: key|session=value/u);
  expect(redactHttpCredentials("ordinary output")).toBe("ordinary output");
});
