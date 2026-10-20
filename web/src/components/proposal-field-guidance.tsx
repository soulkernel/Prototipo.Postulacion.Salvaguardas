import { proposalGuidance } from "@/lib/proposal-guidance";
import type { Locale } from "@/lib/domain";
export function ProposalFieldGuidance({
  field,
  locale,
  id,
}: {
  field: string;
  locale: Locale;
  id?: string;
}) {
  const items = proposalGuidance(field, locale);
  return (
    <div id={id} className="proposal-field-guidance field-help">
      {items.length === 1 ? (
        <p>{items[0]}</p>
      ) : (
        <ul>
          {items.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
