"use client";

import dynamic from "next/dynamic";

const DashboardShellClient = dynamic(() => import("./dashboard-shell-client"), {
  ssr: false,
  loading: () => <div className="min-h-svh" />,
});

type DashboardShellSlotProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  roleBadgeLabel?: string;
  roleBadgeClassName?: string;
};

export function DashboardShellSlot(props: DashboardShellSlotProps) {
  return <DashboardShellClient {...props} />;
}

