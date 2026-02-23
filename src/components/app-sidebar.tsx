import * as React from "react";
import {
  IconAd,
  IconBook,
  IconUsers,
  IconStretching,
  IconHome,
  IconTarget,
  IconKey,
} from "@tabler/icons-react";
import { Dumbbell, Trophy, Swords } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { currentUser } from "@clerk/nextjs/server";
import { Skeleton } from "./ui/skeleton";
import { SedesSwitcherSlot } from "./sedes-switcher-slot";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await currentUser();

  const data = {
    user: {
      name: user?.fullName || "",
      email: user?.emailAddresses[0].emailAddress || "",
      avatar: user?.imageUrl || "",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/" + user?.publicMetadata?.role + "/dashboard",
        icon: IconHome,
        roles: ["admin"],
      },
      {
        title: "Metas",
        url: "/" + user?.publicMetadata?.role + "/goals",
        icon: IconTarget,
        roles: ["admin"],
      },
      {
        title: "Clases",
        url: "/" + user?.publicMetadata?.role + "/classes",
        icon: IconBook,
        roles: ["admin", "user"],
      },
      {
        title: "Usuarios",
        url: "/" + user?.publicMetadata?.role + "/users",
        icon: IconUsers,
        roles: ["admin"],
      },

      {
        title: "Rutinas",
        url: "/" + user?.publicMetadata?.role + "/routines",
        icon: IconStretching,
        roles: ["admin", "user"],
      },
      {
        title: "Ejercicios",
        url: "/" + user?.publicMetadata?.role + "/exercises",
        icon: IconAd,
        roles: ["admin"],
      },
      {
        title: "Clave API",
        url: "/" + user?.publicMetadata?.role + "/api-key",
        icon: IconKey,
        roles: ["medibook"],
      },
      {
        title: "Leaderboard",
        url: "/" + user?.publicMetadata?.role + "/leaderboard",
        icon: Trophy,
        roles: ["admin"],
      },
      {
        title: "Mi progreso",
        url: "/" + user?.publicMetadata?.role + "/gamification",
        icon: IconTarget,
        roles: ["user"],
      },
      {
        title: "Logros",
        url: "/" + user?.publicMetadata?.role + "/badges",
        icon: Trophy,
        roles: ["user"],
      },
      {
        title: "Desafíos",
        url: "/" + user?.publicMetadata?.role + "/challenges",
        icon: Swords,
        roles: ["user"],
      },
    ],
  };

  const userData = {
    name: user?.fullName || "",
    email: user?.emailAddresses[0].emailAddress || "",
    avatar: user?.imageUrl || "",
  };

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Dumbbell />
                <span className="text-base font-semibold">GymCloud</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SedesSwitcherSlot isAdmin={user?.publicMetadata.role === "admin"} />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {user ? (
          <NavMain
            items={data.navMain.filter((item) =>
              item.roles.includes(user.publicMetadata.role as string)
            )}
          />
        ) : (
          <div className="flex flex-col gap-2 mt-3">
            <Skeleton className="h-6 w-full rounded-md" />
            <Skeleton className="h-6 w-full rounded-md" />
            <Skeleton className="h-6 w-full rounded-md" />
            <Skeleton className="h-6 w-full rounded-md" />
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser user={userData} />
        ) : (
          <Skeleton className="h-12 w-full rounded-md" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
