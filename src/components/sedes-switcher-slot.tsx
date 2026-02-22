"use client";

import dynamic from "next/dynamic";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const SedesSwitcherClientOnly = dynamic(
  () => import("./sedes-switcher").then((mod) => mod.SedesSwitcher),
  {
    ssr: false,
    loading: () => (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className="h-10 w-full rounded-md" />
        </SidebarMenuItem>
      </SidebarMenu>
    ),
  }
);

export function SedesSwitcherSlot({ isAdmin }: { isAdmin: boolean }) {
  return <SedesSwitcherClientOnly isAdmin={isAdmin} />;
}

