// ============================================================================
// send-ticket-email — Supabase Edge Function
// Sends ticket-related emails over SMTP (e.g. Gmail + App Password).
//
// Deploy (one-time, from your machine):
//   supabase login
//   supabase link --project-ref <your-project-ref>
//   supabase secrets set SMTP_HOST=smtp.gmail.com SMTP_PORT=587 \
//     SMTP_USER=you@gmail.com SMTP_PASS=<16-char-app-password> \
//     SMTP_FROM_NAME="MTA Ghana Portal"
//   supabase functions deploy send-ticket-email
//
// Invoked by the client (src/lib/supabaseService.js) right after a ticket
// is created, replied to, or closed:
//   supabase.functions.invoke('send-ticket-email', { body: { type, ticketId, replyId } })
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') || '587');
const SMTP_USER = Deno.env.get('SMTP_USER') || '';
const SMTP_PASS = Deno.env.get('SMTP_PASS') || '';
const SMTP_FROM_NAME = Deno.env.get('SMTP_FROM_NAME') || 'MTA Ghana Portal';
const APP_URL = Deno.env.get('APP_URL') || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function escapeHtml(str: unknown) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmail(title: string, bodyHtml: string) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1F2937;">
    <div style="background: #1A3FA0; padding: 20px 24px; border-radius: 8px 8px 0 0;">
      <span style="color:#fff; font-size: 15px; font-weight: 700; letter-spacing: 0.02em;">MTA Ghana Operations Portal</span>
    </div>
    <div style="border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
      <h2 style="margin: 0 0 12px; font-size: 17px; color: #111827;">${escapeHtml(title)}</h2>
      ${bodyHtml}
      ${APP_URL ? `<p style="margin-top:24px;"><a href="${APP_URL}" style="color:#1A3FA0; font-weight:600; text-decoration:none;">Open the portal &rarr;</a></p>` : ''}
      <p style="margin-top: 24px; font-size: 12px; color: #9CA3AF;">This is an automated message from the MTA Ghana Operations Dashboard. Please do not reply directly to this email.</p>
    </div>
  </div>`;
}

async function sendMail(to: string | string[], subject: string, html: string) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP secrets not configured — skipping email send.');
    return;
  }

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: SMTP_PORT === 465,
      auth: { username: SMTP_USER, password: SMTP_PASS },
    },
  });

  try {
    await client.send({
      from: `${SMTP_FROM_NAME} <${SMTP_USER}>`,
      to: recipients,
      subject,
      html,
      content: 'auto',
    });
  } finally {
    await client.close();
  }
}

function ticketMetaHtml(ticket: any) {
  return `
    <table style="width:100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;">
      <tr><td style="color:#6B7280; padding: 3px 0;">Ticket #</td><td style="padding:3px 0; font-weight:600;">${escapeHtml(ticket.ticket_no)}</td></tr>
      <tr><td style="color:#6B7280; padding: 3px 0;">Category</td><td style="padding:3px 0;">${escapeHtml(ticket.category)}${ticket.linked_record_label ? ' — ' + escapeHtml(ticket.linked_record_label) : ''}</td></tr>
      <tr><td style="color:#6B7280; padding: 3px 0;">Raised by</td><td style="padding:3px 0;">${escapeHtml(ticket.created_by_name)}</td></tr>
    </table>`;
}

Deno.serve(async (req) => {
  const CORS_HEADERS = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

  try {
    const { type, ticketId, replyId } = await req.json();
    if (!type || !ticketId) return json({ error: 'Missing type or ticketId' }, 400);

    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketErr || !ticket) return json({ error: 'Ticket not found' }, 404);

    if (type === 'new_ticket') {
      const { data: admins } = await supabase
        .from('users')
        .select('id, email')
        .in('role', ['admin', 'super_admin']);

      const recipients = (admins || [])
        .filter((a: any) => a.id !== ticket.created_by)
        .map((a: any) => a.email);

      await sendMail(
        recipients,
        `New Ticket #${ticket.ticket_no}: ${ticket.subject}`,
        wrapEmail(
          `New Support Ticket — ${escapeHtml(ticket.subject)}`,
          `${ticketMetaHtml(ticket)}<p style="white-space:pre-wrap; line-height:1.5;">${escapeHtml(ticket.description)}</p>`
        )
      );
    } else if (type === 'reply') {
      if (!replyId) return json({ error: 'Missing replyId' }, 400);
      const { data: reply } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('id', replyId)
        .single();

      if (!reply) return json({ error: 'Reply not found' }, 404);

      const isAdminReply = ['admin', 'super_admin'].includes(reply.author_role);

      if (isAdminReply) {
        if (ticket.created_by_email && reply.author_id !== ticket.created_by) {
          await sendMail(
            ticket.created_by_email,
            `Reply on your Ticket #${ticket.ticket_no}`,
            wrapEmail(
              `${escapeHtml(reply.author_name)} replied to your ticket`,
              `${ticketMetaHtml(ticket)}<p style="white-space:pre-wrap; line-height:1.5; background:#F9FAFB; padding:12px; border-radius:6px;">${escapeHtml(reply.message)}</p>`
            )
          );
        }
      } else {
        const { data: admins } = await supabase
          .from('users')
          .select('email')
          .in('role', ['admin', 'super_admin']);
        const recipients = (admins || []).map((a: any) => a.email);

        await sendMail(
          recipients,
          `Reply on Ticket #${ticket.ticket_no}: ${ticket.subject}`,
          wrapEmail(
            `${escapeHtml(reply.author_name)} added a reply`,
            `${ticketMetaHtml(ticket)}<p style="white-space:pre-wrap; line-height:1.5; background:#F9FAFB; padding:12px; border-radius:6px;">${escapeHtml(reply.message)}</p>`
          )
        );
      }
    } else if (type === 'closed') {
      if (ticket.created_by_email && ticket.closed_by !== ticket.created_by) {
        await sendMail(
          ticket.created_by_email,
          `Ticket #${ticket.ticket_no} Closed`,
          wrapEmail(
            `Your ticket has been closed`,
            `${ticketMetaHtml(ticket)}<p>Your ticket "${escapeHtml(ticket.subject)}" has been marked as closed. If this needs further attention, please open a new ticket referencing it.</p>`
          )
        );
      }
    } else {
      return json({ error: `Unknown type: ${type}` }, 400);
    }

    return json({ success: true });
  } catch (err) {
    console.error('send-ticket-email error:', err);
    return json({ error: String(err) }, 500);
  }
});
