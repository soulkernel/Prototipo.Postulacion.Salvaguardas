export function uploadSelectionError(
  files: { name: string; size: number }[],
  accept: string,
) {
  if (files.length !== 1) return "single";
  if (files[0].size <= 0 || files[0].size > 4 * 1024 * 1024) return "size";
  const extensions = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.startsWith("."));
  if (
    extensions.length &&
    !extensions.some((ext) => files[0].name.toLowerCase().endsWith(ext))
  )
    return "format";
  return null;
}
