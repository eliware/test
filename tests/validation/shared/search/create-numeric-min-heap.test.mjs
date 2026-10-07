import { expect, test } from "@jest/globals";
import { createNumericMinHeap } from "../../../../src/validation/shared/search/create-numeric-min-heap.mjs";

test("keeps inserted numeric values ordered at the root", () => {
  const heap = createNumericMinHeap();
  [8, 2, 7, 1, 5].forEach(heap.insert);
  expect(heap.size).toBe(5);
  expect([heap.removeRoot(), heap.removeRoot(), heap.removeRoot()]).toEqual([1, 2, 5]);
  expect(heap.peek()).toBe(7);
});

test("removes the final value and returns undefined for an empty heap", () => {
  const heap = createNumericMinHeap();
  heap.insert(3);
  expect(heap.removeRoot()).toBe(3);
  expect(heap.size).toBe(0);
  expect(heap.peek()).toBeUndefined();
  expect(heap.removeRoot()).toBeUndefined();
});

test("removes inserted values in ascending order", () => {
  const heap = createNumericMinHeap();
  const values = [0, 1, 2, 10, 11, 3, 4, 12, 13, 14, 15, 5, 6, 7, 8];
  values.forEach(heap.insert);
  expect(Array.from({ length: values.length }, () => heap.removeRoot())).toEqual(
    values.toSorted((left, right) => left - right),
  );
});
