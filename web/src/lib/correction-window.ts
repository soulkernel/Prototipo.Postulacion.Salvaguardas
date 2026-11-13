// datetime-local has no zone: all deadlines entered by GLF use Galápagos UTC-6.
export function galapagosDateInput(time: number) {
  return new Date(time - 6 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
export function correctionWindow(stage: number, closes: string | null, phase2: string | null, now: number) {
  const end = Date.parse((stage === 1 ? closes : phase2) || "");
  const nextMinute = Math.ceil((now + 1) / 60000) * 60000;
  return {
    allowed: Number.isFinite(end) && end >= nextMinute,
    min: galapagosDateInput(nextMinute),
    max: Number.isFinite(end) ? galapagosDateInput(end) : "",
  };
}
