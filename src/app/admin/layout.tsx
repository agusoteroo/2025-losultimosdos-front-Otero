import { AppSidebar } from "@/components/app-sidebar";
import { DashboardShellSlot } from "@/components/dashboard-shell-slot";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();
  const user = await currentUser();

  if (!isAuthenticated) return redirectToSignIn();

  if (user?.publicMetadata.role !== "admin") return redirect("/");

  return (
    <DashboardShellSlot
      sidebar={<AppSidebar />}
      roleBadgeLabel="Admin"
      roleBadgeClassName="border-transparent bg-gradient-to-r from-indigo-500 to-pink-500 [background-size:105%] bg-center text-white text-base"
    >
      {children}
    </DashboardShellSlot>
  );
};

export default AdminLayout;
