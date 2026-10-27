import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { tagPriority } = require("../../functions/lib/priority.js");

const medical = { name: "Medical Emergency", defaultPriority: "High", keywords: ["unconscious"] };
const theft = { name: "Theft", defaultPriority: "Medium", keywords: ["weapon", " knife "] };
const hazard = { name: "Facility Hazard", defaultPriority: "Low", keywords: ["exposed wire"] };

describe("tagPriority (rule-based, FR08)", () => {
  test("SOS is always High", () => {
    expect(tagPriority({ isSOS: true, description: "" }, hazard)).toEqual({ priority: "High", reason: "SOS request" });
  });

  test("uses the incident type's default priority", () => {
    expect(tagPriority({ isSOS: false, description: "Phone stolen at canteen" }, theft).priority).toBe("Medium");
    expect(tagPriority({ isSOS: false, description: "Broken chair" }, hazard).priority).toBe("Low");
    expect(tagPriority({ isSOS: false, description: "Student feels dizzy" }, medical).priority).toBe("High");
  });

  test("a keyword raises the report to High, case-insensitively and ignoring spaces", () => {
    const result = tagPriority({ isSOS: false, description: "Man with a KNIFE took my bag" }, theft);
    expect(result).toEqual({ priority: "High", reason: 'Keyword "knife" in description' });
    expect(tagPriority({ isSOS: false, description: "Exposed wire near CR" }, hazard).priority).toBe("High");
  });

  test("an unknown type falls back to Medium", () => {
    expect(tagPriority({ isSOS: false, description: "?" }, null).priority).toBe("Medium");
  });

  test("blank keywords never match", () => {
    expect(tagPriority({ isSOS: false, description: "anything" }, { ...hazard, keywords: ["", "  "] }).priority).toBe("Low");
  });
});
