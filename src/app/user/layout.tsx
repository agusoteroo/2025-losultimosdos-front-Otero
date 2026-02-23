import { AppSidebar } from "@/components/app-sidebar";
import { DashboardShellSlot } from "@/components/dashboard-shell-slot";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = await auth();
  const user = await currentUser();

  if (!isAuthenticated || user?.publicMetadata.role !== "user")
    return redirect("/admin/dashboard");

  return (
    <DashboardShellSlot sidebar={<AppSidebar />}>{children}</DashboardShellSlot>
  );
};

export default AdminLayout;
