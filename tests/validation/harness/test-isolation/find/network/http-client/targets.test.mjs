import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import {
  isInjectedHttpClient,
  targetsLocalhost,
} from "../../../../../../../src/validation/harness/test-isolation/find/network/http-client/targets.mjs";

function argument(source) {
  return parse(`request(${source});`).program.body[0].expression.arguments[0];
}

test("allows localhost URLs and host options", () => {
  expect(targetsLocalhost(argument('"http://localhost:8080"'))).toBe(true);
  expect(targetsLocalhost(argument('"http://[::1]:8080"'))).toBe(true);
  expect(targetsLocalhost(argument('{ hostname: "127.0.0.1", port: 8080 }'))).toBe(true);
  expect(targetsLocalhost(argument('{ ["hostname"]: "localhost" }'))).toBe(true);
});

test("rejects external, malformed, and unknown targets", () => {
  expect(targetsLocalhost(argument('"https://example.com"'))).toBe(false);
  expect(targetsLocalhost(argument('"localhost/path"'))).toBe(false);
  expect(targetsLocalhost(argument("target"))).toBe(false);
  expect(targetsLocalhost(argument("{ hostname: host }"))).toBe(false);
});

test("recognizes HTTP client parameter names", () => {
  expect(
    isInjectedHttpClient(parse("httpClient.request()").program.body[0].expression.callee.object),
  ).toBe(true);
  expect(
    isInjectedHttpClient(parse("client.request()").program.body[0].expression.callee.object),
  ).toBe(false);
  expect(
    isInjectedHttpClient(
      parse("httpClient.transport.request()").program.body[0].expression.callee.object,
    ),
  ).toBe(true);
  expect(isInjectedHttpClient(parse("0").program.body[0].expression)).toBe(false);
});
