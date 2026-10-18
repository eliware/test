import { expect, test } from "@jest/globals";
import { isSqlStatement } from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/is/sql/statement.mjs";

test.each([
  "SELECT alignment, base, facility, fix, join, portion, real, transition, trim FROM nasr",
  "SELECT GET_LOCK(?, 1) AS acquired",
  "LEFT JOIN FIX_BASE ON FIX_BASE.BASE_ID = procedure.id",
  "INSERT INTO records (base) VALUES ('real')",
  "INSERT IGNORE INTO message_attachments (disposition, part_order) VALUES (?, ?)",
  "INSERT IGNORE\nINTO message_attachments (disposition, part_order)\nVALUES (?, ?)",
  "UPDATE records SET portion = 'fix'",
  "DELETE FROM records WHERE alignment = 'trim'",
  "CREATE TABLE facility (port TEXT)",
  "WITH values AS (SELECT real FROM nasr) SELECT * FROM values",
])("recognizes SQL syntax: %s", (text) => {
  expect(isSqlStatement(text)).toBe(true);
});

test.each([
  "Select a real portion of the base.",
  "Join the team for a transition.",
  "Left join the team to fix the real base.",
])("keeps ordinary prose: %s", (text) => {
  expect(isSqlStatement(text)).toBe(false);
});
