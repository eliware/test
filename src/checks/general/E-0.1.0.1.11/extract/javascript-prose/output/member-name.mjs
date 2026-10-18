export function memberName(member) {
  if (member.computed && member.property?.type === "StringLiteral") return member.property.value;
  return member.property?.name;
}
