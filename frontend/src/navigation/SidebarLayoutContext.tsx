import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export const SIDEBAR_WIDTH_EXPANDED = 188;
export const SIDEBAR_WIDTH_COLLAPSED = 56;

type SidebarLayoutContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  collapseSidebar: () => void;
};

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(
  null,
);

export function SidebarLayoutProvider({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => !value);
  }, []);

  const collapseSidebar = useCallback(() => {
    setCollapsed(true);
  }, []);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, collapseSidebar }),
    [collapsed, toggleCollapsed, collapseSidebar],
  );

  return (
    <SidebarLayoutContext.Provider value={value}>
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) {
    throw new Error("useSidebarLayout must be used within SidebarLayoutProvider");
  }
  return ctx;
}
