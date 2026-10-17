const sqlStatement =
  /^\s*(?:SELECT\b[\s\S]*?\bFROM\b|INSERT\s+INTO\b|UPDATE\b[\s\S]*?\bSET\b|DELETE\s+FROM\b|CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\b|ALTER\s+TABLE\b|DROP\s+TABLE\b|PRAGMA\b|WITH\b[\s\S]*?\bSELECT\b)/iu;
const sqlJoinFragment =
  /^\s*(?:(?:LEFT|RIGHT|FULL|INNER|CROSS)\s+)?JOIN\b[\s\S]*?\b(?:ON|USING)\b/iu;

export function isSqlStatement(text) {
  return sqlStatement.test(text) || sqlJoinFragment.test(text);
}
