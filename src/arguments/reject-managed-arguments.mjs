import { isManagedOption } from './classify-arguments.mjs';

/** Reject wrapper arguments that eliware-test owns and must not forward. */
export function rejectManagedArguments(argumentsList) {
  const protectedArgument = argumentsList.find(isManagedOption);
  if (protectedArgument) throw new Error(`${protectedArgument} is managed by eliware-test; remove it and use the wrapper command directly.`);
}
