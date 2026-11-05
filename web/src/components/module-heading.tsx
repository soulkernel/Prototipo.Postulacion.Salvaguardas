import type { ReactNode } from "react";

export function ModuleHeading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="module-heading">
      <h1>{title}</h1>
      {children && <div className="module-heading-description">{children}</div>}
    </header>
  );
}
