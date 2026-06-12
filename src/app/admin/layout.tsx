import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/admin/sidebar";
import TopBar from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login page renders its own layout; middleware will redirect non-auth users
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-ink-950 text-ink-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar email={user.email ?? ""} />
        <main className="min-w-0 flex-1 px-6 pb-12 pt-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
