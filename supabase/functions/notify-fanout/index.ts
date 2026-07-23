// supabase/functions/notify-fanout/index.ts
// Database webhook target: fans in-app notifications out to email/SMS
// ONLY when the profile has consented (allow_email / allow_sms) and the
// notification's channels include that medium.
// Wire up: Database Webhooks → notifications INSERT → this function.
// Secrets: RESEND_API_KEY, TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { record } = await req.json(); // notifications row
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('allow_email, allow_sms, phone, id')
    .eq('id', record.user_id).single();
  if (!profile) return Response.json({ ok: true });

  const { data: user } = await supabase.auth.admin.getUserById(profile.id);
  const channels: string[] = record.channels ?? [];

  if (channels.includes('email') && profile.allow_email && user?.user?.email) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'GFA VRCC <hello@vrcc.app>',
        to: user.user.email,
        subject: record.title,
        text: `${record.body ?? ''}\n\nOpen VRCC: https://vrcc.app${record.link ?? ''}\n\nNo Fees. No Stigma. Just Grace.`,
      }),
    });
  }

  if (channels.includes('sms') && profile.allow_sms && profile.phone) {
    const sid = Deno.env.get('TWILIO_SID');
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${sid}:${Deno.env.get('TWILIO_TOKEN')}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: Deno.env.get('TWILIO_FROM')!,
        To: profile.phone,
        Body: `${record.title} — ${record.body ?? ''} vrcc.app${record.link ?? ''}`,
      }),
    });
  }

  return Response.json({ ok: true });
});
