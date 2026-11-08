import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Só a área admin precisa de sessão. A pesquisa pública (/pesquisa/*), a API
// de envio e os estáticos não passam mais pelo middleware (nem pela chamada
// ao Supabase Auth). O export CSV valida o usuário na própria rota.
export const config = {
  matcher: ["/admin/:path*"],
};
