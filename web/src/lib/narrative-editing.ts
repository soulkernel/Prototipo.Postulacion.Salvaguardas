/** An explicit preview suggestion, never a read-time or save-time transformation.
 * Ambiguous short lines, labels, lists, captions and tables remain separate.
 * Even long-line breaks may be intentional, so applying always requires review.
 */
export function adjustNarrativeLineBreaks(value: string): string {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const result: string[] = [];
  const boundary = (line: string) =>
    /^(?:[-*•]\s|\d+[.)]\s|Fig\.?\s*\d|Figure\s+\d|https?:\/\/)/i.test(line) ||
    /^[^:]{1,60}:/.test(line) ||
    /^[\p{Lu}\d\s.,()-]+$/u.test(line);
  for (const original of lines) {
    const indented = /^(?:\t| {2,})\S/.test(original);
    const line = indented ? original.trimEnd() : original.trim();
    const previous = result.at(-1) || "";
    if (!line) {
      if (result.length && result.at(-1) !== "") result.push("");
    } else if (
      previous.length >= 60 &&
      result.at(-1) !== "" &&
      !boundary(line) &&
      !boundary(previous) &&
      !indented &&
      !/^(?:\t| {2,})\S/.test(previous) &&
      !/[\t|]/.test(original + previous) &&
      !/[-:;]$/.test(previous)
    ) {
      result[result.length - 1] += " " + line;
    } else {
      result.push(line);
    }
  }
  while (result.at(-1) === "") result.pop();
  return result.join("\n");
}
