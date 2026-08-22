import { PropsWithChildren } from "react";
import { Text, TextProps } from "react-native";

export type TextVariant =
  | "wordmark"
  | "display"
  | "title"
  | "heading"
  | "subhead"
  | "body"
  | "bodyStrong"
  | "caption"
  | "label"
  | "overline"
  | "numeral";

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TextVariant;
    muted?: boolean;
    accent?: boolean;
    className?: string;
  }
>;

const variantClass: Record<TextVariant, string> = {
  wordmark: "text-wordmark font-bold tracking-brand",
  display: "text-display font-extrabold",
  title: "text-title font-extrabold",
  heading: "text-heading font-semibold",
  subhead: "text-subhead font-semibold",
  body: "text-body",
  bodyStrong: "text-body font-semibold",
  caption: "text-caption",
  label: "text-label font-semibold",
  overline: "text-overline font-semibold uppercase tracking-overline",
  numeral: "text-numeral font-bold",
};

function toneClass(muted: boolean, accent: boolean): string {
  if (accent) return "text-accent";
  if (muted) return "text-muted";
  return "text-ink";
}

export function AppText({
  variant = "body",
  muted = false,
  accent = false,
  className = "",
  children,
  ...rest
}: AppTextProps) {
  const useMutedTone = muted || variant === "caption" || variant === "overline";
  return (
    <Text
      className={`${variantClass[variant]} ${toneClass(useMutedTone && !accent, accent)} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Text>
  );
}
