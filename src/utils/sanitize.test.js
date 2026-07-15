import { describe, it, expect } from "vitest";
import { sanitizeText } from "./sanitize";

describe("sanitizeText", () => {
  it("strips dangerous characters and trims whitespace", () => {
    expect(sanitizeText("  Juan<script> ")).toBe("Juanscript");
    expect(sanitizeText("María José")).toBe("María José");
  });
});
