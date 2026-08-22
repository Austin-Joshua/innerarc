import { PropsWithChildren } from "react";

import { useBreakpoint } from "../../hooks/useBreakpoint";
import { ContentContainer } from "./ContentContainer";

/** Centered reading column on lg+ (Module 17 workout detail/program). */
export function DetailColumn({ children }: PropsWithChildren) {
  const { isAtLeastLg } = useBreakpoint();

  return (
    <ContentContainer
      width={isAtLeastLg ? "prose" : "content"}
      className="w-full"
    >
      {children}
    </ContentContainer>
  );
}

/** Session player — always narrow, never full-bleed. */
export function SessionColumn({ children }: PropsWithChildren) {
  return (
    <ContentContainer width="prose" className="w-full flex-1">
      {children}
    </ContentContainer>
  );
}
