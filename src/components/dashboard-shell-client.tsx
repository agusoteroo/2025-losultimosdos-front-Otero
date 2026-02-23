"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "react-hot-toast";

type DashboardShellClientProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  roleBadgeLabel?: string;
  roleBadgeClassName?: string;
};

export default function DashboardShellClient({
  children,
  sidebar,
  roleBadgeLabel,
  roleBadgeClassName,
}: DashboardShellClientProps) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset>
        <header className="flex flex-col shrink-0 transition-[width,height] ease-linear">
          <div className="flex h-16 items-center gap-2 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1" />
              {roleBadgeLabel ? (
                <Badge className={roleBadgeClassName}>{roleBadgeLabel}</Badge>
              ) : null}
              <div className="ml-4">
                <PageBreadcrumb />
              </div>
            </div>
            <div className="flex items-center gap-2 px-4">
              <ModeToggle />
            </div>
          </div>
        </header>
        <main className="container mx-auto space-y-4 p-4">{children}</main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}

