import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName, senderName, preview } = await req.json();
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!resendKey || !recipientEmail) {
      return new Response(
        JSON.stringify({ sent: false, reason: 'Email provider not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'PAVILION <notifications@pavilion-ops.com>',
        to: [recipientEmail],
        subject: `New message from ${senderName} — PAVILION`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="margin: 0 0 8px; color: #0f172a;">New Team Message</h2>
            <p style="color: #475569; margin: 0 0 16px;">Hi ${recipientName || 'there'}, <strong>${senderName}</strong> sent you a message on PAVILION:</p>
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; color: #0f172a; margin-bottom: 18px;">
              ${preview || 'Sent an attachment'}
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0;">Sign in to PAVILION to reply.</p>
          </div>
        `
      })
    });

    return new Response(
      JSON.stringify({ sent: res.ok }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ sent: false, error: String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
