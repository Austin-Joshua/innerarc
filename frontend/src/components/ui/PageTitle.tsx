import { PropsWithChildren } from "react";

import { AppText, TextVariant } from "./AppText";

type PageTitleProps = PropsWithChildren<{
  variant?: Extract<TextVariant, "display" | "title">;
  className?: string;
}>;

/** Centered, heavy page heading used across shell screens. */
export function PageTitle({
  children,
  variant = "display",
  className = "",
}: PageTitleProps) {
  return (
    <AppText
      variant={variant}
      className={`w-full text-center font-extrabold ${className}`.trim()}
    >
      {children}
    </AppText>
  );
}
