import test from "node:test";
import assert from "node:assert/strict";
import { formatBsDate, formatNpr, localInputDate } from "../src/lib/formatting/nepal.ts";

test("formats a known B.S. new year at Nepal local date", () => {
  assert.equal(formatBsDate("2024-04-12T20:00:00.000Z"), "1 Baisakh 2081 B.S.");
});

test("formats whole NPR values without losing large integer precision", () => {
  assert.equal(formatNpr("9223372036854775807"), "NPR 92,23,37,20,36,85,47,75,807");
});

test("shows ISO timestamps as Nepal local form time", () => {
  assert.equal(localInputDate("2024-04-12T20:00:00.000Z"), "2024-04-13T01:45");
});
