import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { VERIFIED_USER_HEADER } from "@/lib/supabase/middleware";
import Sidebar from "@/components/admin/sidebar";
import TopBar from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O middleware já validou a sessão (getUser) e repassa o e-mail num header
  // interno — evita uma segunda chamada ao Supabase Auth por navegação.
  let email: string | null = null;
  const verified = headers().get(VERIFIED_USER_HEADER);
  if (verified) {
    try {
      email = decodeURIComponent(verified);
    } catch {
      email = null;
    }
  } else {
    // Fallback defensivo (ex.: middleware não executou nesta rota).
    const {
      data: { user },
    } = await createClient().auth.getUser();
    email = user?.email ?? (user ? "" : null);
  }

  // Login page renders its own layout; middleware will redirect non-auth users
  if (email === null) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-ink-950 text-ink-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar email={email} />
        <main className="min-w-0 flex-1 px-6 pb-12 pt-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
