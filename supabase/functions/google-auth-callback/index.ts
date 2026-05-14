import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const reqUrl   = new URL(req.url)
  const code     = reqUrl.searchParams.get("code")
  const state    = reqUrl.searchParams.get("state")
  const errParam = reqUrl.searchParams.get("error")
  const CRM_URL  = Deno.env.get("CRM_URL")!

  const redirect = (qs: string) =>
    Response.redirect(`${CRM_URL}/configuracoes?${qs}`, 302)

  if (errParam)        return redirect(`google=error&reason=${errParam}`)
  if (!code || !state) return redirect("google=error&reason=missing_params")

  // Valida o state
  let userId: string
  try {
    const decoded = JSON.parse(atob(state))
    userId = decoded.uid
    if (!userId || Date.now() - decoded.ts > 10 * 60 * 1000)
      return redirect("google=error&reason=expired_state")
  } catch {
    return redirect("google=error&reason=invalid_state")
  }

  // Troca o code por tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      redirect_uri:  Deno.env.get("GOOGLE_REDIRECT_URI")!,
      grant_type:    "authorization_code",
    }),
  })

  if (!tokenRes.ok) return redirect("google=error&reason=token_exchange")
  const tokens = await tokenRes.json()

  // Busca email Google do usuário
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const userInfo = await userInfoRes.json()

  // Salva tokens via service role (ignora RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()

  const { error: dbErr } = await supabaseAdmin
    .from("google_integrations")
    .upsert(
      {
        user_id:       userId,
        google_email:  userInfo.email ?? "",
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at:    expiresAt,
        calendar_type: "primary",
        updated_at:    new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (dbErr) return redirect(`google=error&reason=db_save`)

  return redirect("google=connected")
})
