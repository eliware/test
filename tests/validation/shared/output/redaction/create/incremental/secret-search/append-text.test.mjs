import { expect, jest, test } from "@jest/globals";
import { attachAppendTextAdapter } from "../../../../../../../../src/validation/shared/output/redaction/create/incremental/secret-search/append-text.mjs";

test("attaches an append-text entrypoint with the default pending-match option", () => {
  const findSafeBoundary = jest.fn();
  const searchAppended = jest.fn().mockReturnValue({ boundary: 3 });
  expect(attachAppendTextAdapter(findSafeBoundary, searchAppended)).toBe(findSafeBoundary);
  expect(findSafeBoundary.appendText("text", 4)).toEqual({ boundary: 3 });
  expect(searchAppended).toHaveBeenCalledWith("text", 4, false);
});

test("forwards the explicit pending-match option", () => {
  const searchAppended = jest.fn();
  const search = attachAppendTextAdapter(jest.fn(), searchAppended);
  search.appendText("text", 4, true);
  expect(searchAppended).toHaveBeenCalledWith("text", 4, true);
});
