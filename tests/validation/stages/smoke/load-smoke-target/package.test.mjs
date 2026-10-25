import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { readSmokeTargetPackage } from "../../../../../src/validation/stages/smoke/load-smoke-target/package.mjs";

test("reads and parses the consumer package manifest", async () => {
  const read = jest.fn().mockResolvedValue('{"name":"consumer"}');
  await expect(readSmokeTargetPackage("C:/consumer", read)).resolves.toEqual({ name: "consumer" });
  expect(read).toHaveBeenCalledWith(join("C:/consumer", "package.json"), "utf8");
});

test("propagates manifest read and parse failures", async () => {
  await expect(
    readSmokeTargetPackage("C:/consumer", jest.fn().mockRejectedValue(Error())),
  ).rejects.toThrow();
  await expect(
    readSmokeTargetPackage("C:/consumer", jest.fn().mockResolvedValue("bad json")),
  ).rejects.toThrow();
});
