/**
 * JSON Merge Patch (RFC 7386) — used to apply a partial config onto a current
 * full config for retrieve-then-merge updates (see STORY-022).
 *
 * Semantics (per RFC 7386):
 * - If `patch` is a plain object, it is merged recursively onto `target`
 *   (which is treated as an empty object if it is not itself a plain object).
 *   For each key in the patch:
 *     - a `null` value DELETES that key from the result;
 *     - any other value is merged recursively.
 * - If `patch` is anything else (scalar, array, or `null`), it REPLACES `target`.
 *
 * Arrays are replaced wholesale (an array is not a "plain object"), which matches
 * RFC 7386 and the WLAN walled-garden semantics: the caller sends the full
 * desired array, not a delta.
 *
 * Inputs are never mutated; the returned value shares no references with either
 * `target` or `patch`. Values must be JSON-serializable (config objects always are).
 */
export function applyMergePatch(target: unknown, patch: unknown): any {
  // Clone both inputs once so the recursive merge can mutate freely and the
  // result is fully independent of the caller's objects.
  return mergeInto(deepClone(target), deepClone(patch));
}

function mergeInto(target: any, patch: any): any {
  if (!isPlainObject(patch)) {
    // scalar | array | null  → replace
    return patch;
  }
  const base: Record<string, any> = isPlainObject(target) ? target : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete base[key];
    } else {
      base[key] = mergeInto(base[key], value);
    }
  }
  return base;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  return value === undefined
    ? value
    : (JSON.parse(JSON.stringify(value)) as T);
}
