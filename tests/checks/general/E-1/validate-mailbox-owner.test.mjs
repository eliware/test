import { expect, test } from "@jest/globals";
import { validateMailboxOwner } from "../../../../src/checks/general/E-1/validate-mailbox-owner.mjs";

test("accepts exactly one canonical owner", () => {
  expect(validateMailboxOwner("MAIL_OWNER_ADDRESS=fixture@eliware.org", "fixture@eliware.org")).toBe(true);
});

test("rejects missing, duplicate, and noncanonical owners", () => {
  expect(validateMailboxOwner("OTHER=value", "fixture@eliware.org")).toBe(false);
  expect(validateMailboxOwner("MAIL_OWNER_ADDRESS=other@eliware.org", "fixture@eliware.org")).toBe(false);
  expect(validateMailboxOwner("MAIL_OWNER_ADDRESS=fixture@eliware.org\nMAIL_OWNER_ADDRESS=fixture@eliware.org", "fixture@eliware.org")).toBe(false);
});
