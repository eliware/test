import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { isSqlQueryArgument } from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/is/sql/query-argument.mjs";

function firstArgument(source) {
  const call = parse(source).program.body[0].expression;
  return [call.arguments[0], call];
}

test.each([
  'connection.query("SELECT GET_LOCK(?, 1)")',
  "db.execute(`INSERT IGNORE INTO records (id) VALUES (?)`)",
  "db.query(`SELECT name FROM records WHERE id = ${id}`)",
])("recognizes SQL in query calls: %s", (source) => {
  const [argument, call] = firstArgument(source);
  expect(isSqlQueryArgument(argument, call)).toBe(true);
});

test("does not classify prose or later query arguments as SQL", () => {
  const [argument, call] = firstArgument('db.query("Explain this result.", "SELECT * FROM rows")');
  expect(isSqlQueryArgument(argument, call)).toBe(false);
  expect(isSqlQueryArgument(call.arguments[1], call)).toBe(false);
  expect(isSqlQueryArgument(argument, null)).toBe(false);
  const [variable, variableCall] = firstArgument("db.query(statement)");
  expect(isSqlQueryArgument(variable, variableCall)).toBe(false);
  const [wrongMethodValue, wrongMethodCall] = firstArgument('db.send("SELECT * FROM rows")');
  expect(isSqlQueryArgument(wrongMethodValue, wrongMethodCall)).toBe(false);
  const bareCall = parse('query("SELECT * FROM rows")').program.body[0].expression;
  expect(isSqlQueryArgument(bareCall.arguments[0], bareCall)).toBe(false);
  const [computedValue, computedCall] = firstArgument('db["query"]("SELECT * FROM rows")');
  expect(isSqlQueryArgument(computedValue, computedCall)).toBe(true);
});
