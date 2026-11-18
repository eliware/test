import isUserFacingOutputProperty from "../properties.mjs";
import addOutputProseBlocks from "./blocks.mjs";

export default function collectOutputPropertyProse(assignment, blocks) {
  if (!isUserFacingOutputProperty(assignment.left)) return;
  addOutputProseBlocks(assignment.right, assignment.loc.start.line, blocks);
}
