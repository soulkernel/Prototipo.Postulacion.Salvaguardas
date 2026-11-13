export function submissionError(message: string): string {
  return (
    message.match(/GLF_[A-Z_]+(?::[a-z0-9_]+)?/)?.[0] ||
    "GLF_SUBMISSION_UNAVAILABLE"
  );
}
