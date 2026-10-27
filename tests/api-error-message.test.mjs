import assert from "node:assert/strict";
import test from "node:test";
import { getApiErrorMessage } from "../src/lib/api/error-message.ts";

test("extracts nested API errors for the toast", () => {
  const response = {
    success: false,
    error: { code: "CONFLICT", message: "Client has linked records" },
    requestId: "b5ac5b81-ce14-4500-8774-6d310bd55468",
  };
  assert.equal(getApiErrorMessage(response), "Client has linked records");
});

test("handles validation message arrays and object-only fallbacks", () => {
  assert.equal(getApiErrorMessage({ message: ["Name is required", { message: "Email is invalid" }] }), "Name is required Email is invalid");
  assert.equal(getApiErrorMessage({ error: { code: "CONFLICT" } }, "Please try again."), "Please try again.");
});
