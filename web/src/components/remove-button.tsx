import type { ComponentProps } from "react";
import { Trash2 } from "lucide-react";

type RemoveButtonProps = Omit<
  ComponentProps<"button">,
  "children" | "aria-label"
> & {
  "aria-label": string;
  compact?: boolean;
};

/** Local removal or entry to a confirmation; never bypass deletion safeguards. */
export function RemoveButton({
  "aria-label": label,
  title,
  className = "",
  compact = false,
  type = "button",
  ...props
}: RemoveButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={title ?? label}
      className={`button remove-icon-button${compact ? " remove-icon-compact" : ""} ${className}`.trim()}
    >
      <Trash2 size={16} aria-hidden="true" />
    </button>
  );
}
