import { stat } from "node:fs/promises";

export async function validateLocalStructuredReference(target) {
  await stat(target);
}
