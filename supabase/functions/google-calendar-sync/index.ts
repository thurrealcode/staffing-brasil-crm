import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// ── Helpers ───────────────────────────────────────────────────

async function refreshToken(integration: Record<string, string>, supabaseAdmin: ReturnType<typeof createClient>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: integration.refresh_token,
      grant_type:    "refresh_token",
    }),
  })
  if (!res.ok) throw new Error("Falha ao renovar access_token")
  const data = await res.json()
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString()
  await supabaseAdmin
    .from("google_integrations")
    .update({ access_token: data.access_token, expires_at: expiresAt })
    .eq("user_id", integration.user_id)
  return data.access_token as string
}

function buildDatetime(data: string, horario: string) {
  const [h, min] = (horario || "09:00").split(":").map(Number)
  const pad = (n: number) => String(n).padStart(2, "0")
  // Passa horário local sem sufixo Z — Google interpreta no timeZone informado
  const startStr = `${data}T${pad(h)}:${pad(min)}:00`
  const endH = h + 1 >= 24 ? 23 : h + 1
  const endMin = h + 1 >= 24 ? 59 : min
  const endStr = `${data}T${pad(endH)}:${pad(endMin)}:00`
  return { startStr, endStr }
}

// ── Handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader)
    return new Response("Unauthorized", { status: 401, headers: corsHeaders })

  // Verifica JWT do chamador
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user)
    return new Response("Unauthorized", { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const body = await req.json()
  const { eventoId, responsavelEmail, titulo, data, horario, empresa, contato, local, observacoes, participantes } = body

  // ── Busca integração do responsável ou fallback para o chamador ──

  let integration: Record<string, string> | null = null

  if (responsavelEmail) {
    const { data: byEmail } = await supabaseAdmin
      .from("google_integrations")
      .select("*")
      .eq("google_email", responsavelEmail)
      .maybeSingle()
    integration = byEmail
  }

  if (!integration) {
    const { data: byUser } = await supabaseAdmin
      .from("google_integrations")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
    integration = byUser
  }

  // Sem integração → marca evento e retorna sem erro fatal
  if (!integration) {
    await supabaseAdmin
      .from("agenda")
      .update({ sync_status: "no_integration" })
      .eq("id", eventoId)
    return new Response(
      JSON.stringify({ ok: false, reason: "no_integration" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  // ── Renova token se expirado ──────────────────────────────────

  let accessToken = integration.access_token
  if (new Date(integration.expires_at) <= new Date()) {
    try {
      accessToken = await refreshToken(integration, supabaseAdmin)
    } catch {
      await supabaseAdmin.from("agenda").update({ sync_status: "token_error" }).eq("id", eventoId)
      return new Response(
        JSON.stringify({ ok: false, reason: "token_refresh_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
  }

  // ── Cria evento no Google Calendar com Google Meet ────────────

  const { startStr, endStr } = buildDatetime(data, horario)

  const description = [
    empresa && `Empresa: ${empresa}`,
    contato && `Contato: ${contato}`,
    observacoes || "",
  ].filter(Boolean).join("\n")

  const attendees = (participantes || "")
    .split(",")
    .map((e: string) => e.trim())
    .filter((e: string) => e.includes("@"))
    .map((email: string) => ({ email }))

  const eventPayload: Record<string, unknown> = {
    summary:     titulo,
    description,
    location:    local || undefined,
    start: { dateTime: startStr, timeZone: "America/Sao_Paulo" },
    end:   { dateTime: endStr,   timeZone: "America/Sao_Paulo" },
    conferenceData: {
      createRequest: {
        requestId: `staffing-crm-${eventoId}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  }

  if (attendees.length > 0) {
    eventPayload.attendees = attendees
  }

  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    }
  )

  if (!calRes.ok) {
    const detail = await calRes.text()
    await supabaseAdmin.from("agenda").update({ sync_status: "error" }).eq("id", eventoId)
    return new Response(
      JSON.stringify({ ok: false, reason: "google_api_error", detail }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const calEvent = await calRes.json()
  const meetLink = (calEvent.conferenceData?.entryPoints ?? [])
    .find((e: Record<string, string>) => e.entryPointType === "video")?.uri ?? null

  // Atualiza evento na agenda com dados do Google Calendar
  await supabaseAdmin
    .from("agenda")
    .update({
      google_event_id: calEvent.id,
      meet_link:       meetLink,
      sync_status:     "synced",
    })
    .eq("id", eventoId)

  return new Response(
    JSON.stringify({ ok: true, googleEventId: calEvent.id, meetLink }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
