/**
 * Safe stub evaluator for decision conditions (simulation only).
 * @param {string} condition
 * @returns {boolean}
 */
export function evaluateCondition(condition) {
  const trimmed = String(condition ?? "").trim().toLowerCase();

  if (!trimmed) return true;
  if (trimmed === "false" || trimmed === "0" || trimmed === "no") return false;
  if (trimmed === "true" || trimmed === "1" || trimmed === "yes") return true;

  const gtMatch = trimmed.match(/^(.+?)\s*>\s*(-?\d+(?:\.\d+)?)$/);
  if (gtMatch) {
    const left = gtMatch[1].trim();
    const right = Number(gtMatch[2]);
    const mockValues = { stock: 10, score: 75, age: 21 };
    const leftValue = mockValues[left] ?? 0;
    return leftValue > right;
  }

  const includesMatch = trimmed.match(/^(.+?)\s+includes\s+['"](.+?)['"]$/);
  if (includesMatch) {
    const mockStrings = { email: "user@example.com" };
    const value = mockStrings[includesMatch[1].trim()] ?? "";
    return value.includes(includesMatch[2]);
  }

  return true;
}
