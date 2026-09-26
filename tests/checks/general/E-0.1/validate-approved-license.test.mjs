import { expect, test } from "@jest/globals";
import { validateApprovedLicense } from "../../../../src/checks/general/E-0.1/validate-approved-license.mjs";

test("accepts and requires the complete approved MIT license text", () => {
  const approved = `MIT License
Copyright (c) 2026 Eliware
Permission is hereby granted
THE SOFTWARE IS PROVIDED "AS IS"
WITHOUT WARRANTY OF ANY KIND
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE`;
  expect(validateApprovedLicense(approved)).toBeNull();
  expect(validateApprovedLicense("MIT License\nCopyright (c) 2026 Eliware\n")).toContain(
    "Permission is hereby granted",
  );
});
