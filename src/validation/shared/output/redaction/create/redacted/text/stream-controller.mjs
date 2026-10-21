import { StringDecoder } from "node:string_decoder";
import { createRedactedStreamOutput } from "../stream/output.mjs";
import { createRedactedTextStreamSession } from "./session.mjs";

export function createRedactedTextStreamController(policy, outputLimit) {
  const decoder = new StringDecoder("utf8");
  const output = createRedactedStreamOutput(outputLimit);
  return createRedactedTextStreamSession(policy, decoder, output, outputLimit);
}
