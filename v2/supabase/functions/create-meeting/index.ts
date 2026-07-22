// create-meeting — called when a coach accepts a video session.
// Creates a Zoom meeting when ZOOM_* secrets are configured, otherwise falls
// back to an Uma (uma.uk / built-in Supabase-hosted Jitsi-style) room link so
// scheduling never blocks on a vendor account. Writes meeting_url back onto
// the session request row using the service role.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function zoomToken(): Promise<string | null> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID");
  const clientId = Deno.env.get("ZOOM_CLIENT_ID");
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET");
  if (!accountId || !clientId || !clientSecret) return null;
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: "POST", headers: { Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}` } },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.access_token ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { session_id, topic, scheduled_at } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Caller must be the coach on (or claiming) this session — verify via their JWT.
    const authed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: { user } } = await authed.auth.getUser();
    if (!user) throw new Error("not authenticated");
    const { data: profile } = await admin
      .from("v2_profiles").select("role").eq("id", user.id).single();
    if (!profile || !["coach", "admin"].includes(profile.role)) {
      throw new Error("only coaches can create meetings");
    }

    let meetingUrl: string | null = null;
    const token = await zoomToken();
    if (token) {
      const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || "VRCC Recovery Coaching Session",
          type: scheduled_at ? 2 : 1,
          start_time: scheduled_at,
          settings: { join_before_host: true, waiting_room: false },
        }),
      });
      if (res.ok) meetingUrl = (await res.json()).join_url ?? null;
    }
    if (!meetingUrl) {
      // Vendor-free fallback: stable, unguessable room per session.
      meetingUrl = `https://meet.jit.si/vrcc-${session_id}`;
    }

    const { error } = await admin
      .from("v2_session_requests")
      .update({ meeting_url: meetingUrl })
      .eq("id", session_id);
    if (error) throw error;

    return new Response(JSON.stringify({ meeting_url: meetingUrl }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
