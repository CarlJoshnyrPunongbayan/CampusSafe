export type Priority = "High" | "Medium" | "Low";

export interface PriorityInput {
  isSOS: boolean;
  description: string;
}

export interface IncidentTypeRule {
  name?: string;
  defaultPriority: Priority;
  keywords: string[];
}

export interface PriorityResult {
  priority: Priority;
  reason: string;
}

/**
 * Rule-based priority tagging (FR08, Table X). No machine learning is used.
 *  1. SOS requests are always High.
 *  2. A keyword of the incident type found in the description raises the report to High.
 *  3. Otherwise the incident type's default priority applies.
 * An unknown type falls back to Medium so it is still looked at promptly.
 * The security officer confirms or overrides the result on the dashboard.
 */
export function tagPriority(input: PriorityInput, type: IncidentTypeRule | null): PriorityResult {
  if (input.isSOS) return { priority: "High", reason: "SOS request" };
  if (!type) return { priority: "Medium", reason: "Unknown incident type" };

  const text = input.description.toLowerCase();
  const keyword = type.keywords.find((k) => k.trim() !== "" && text.includes(k.trim().toLowerCase()));
  if (keyword) return { priority: "High", reason: `Keyword "${keyword.trim()}" in description` };

  return { priority: type.defaultPriority, reason: `Default for ${type.name ?? "incident type"}` };
}
