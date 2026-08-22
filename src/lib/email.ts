import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

type PasswordRecoveryMessage = {
  recipient: string;
  resetUrl: string;
};

export interface EmailProvider {
  sendPasswordRecovery(message: PasswordRecoveryMessage): Promise<void>;
}

// ---------------------------------------------------------------------------
// Console provider — prints the recovery link to the terminal (local dev)
// ---------------------------------------------------------------------------
class ConsoleEmailProvider implements EmailProvider {
  async sendPasswordRecovery({ recipient, resetUrl }: PasswordRecoveryMessage) {
    console.info(`[GlobeTrotter recovery] ${recipient}: ${resetUrl}`);
  }
}

// ---------------------------------------------------------------------------
// SMTP provider — sends a real email via nodemailer
// ---------------------------------------------------------------------------
class SmtpEmailProvider implements EmailProvider {
  private createTransporter(): { transporter: Transporter; from: string } {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'noreply@globetrotter.com';

    if (!host) {
      throw new Error('SMTP_HOST is required when EMAIL_PROVIDER is set to "smtp".');
    }
    if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('SMTP_PORT must be a valid TCP port.');
    if (Boolean(user) !== Boolean(pass)) throw new Error('SMTP_USER and SMTP_PASS must be configured together.');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
    return { transporter, from };
  }

  async sendPasswordRecovery({ recipient, resetUrl }: PasswordRecoveryMessage) {
    const { transporter, from } = this.createTransporter();
    const html = buildRecoveryEmailHtml(resetUrl);
    const text = buildRecoveryEmailText(resetUrl);

    await transporter.sendMail({
      from,
      to: recipient,
      subject: 'GlobeTrotter — Reset your password',
      html,
      text,
    });
  }
}

// ---------------------------------------------------------------------------
// HTML template for the recovery email
// ---------------------------------------------------------------------------
export function buildRecoveryEmailHtml(resetUrl: string): string {
  const safeResetUrl = resetUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="background:linear-gradient(135deg,#0a1628,#1a2744);padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">🌍 GlobeTrotter</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:600">Reset your password</h2>
          <p style="margin:0 0 24px;color:#4a4a68;font-size:15px;line-height:1.6">
            We received a request to reset the password for your GlobeTrotter account.
            Click the button below to choose a new password. This link expires in <strong>30 minutes</strong>.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
            <tr><td style="background:#2563eb;border-radius:8px">
              <a href="${safeResetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">
                Reset Password
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#4a4a68;font-size:13px;line-height:1.5">
            If the button doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="margin:0 0 24px;word-break:break-all;color:#2563eb;font-size:13px">${safeResetUrl}</p>
          <hr style="border:none;border-top:1px solid #e8e8ee;margin:24px 0">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5">
            If you didn't request this, you can safely ignore this email — your password will remain unchanged.
          </p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:11px;text-align:center">
        © ${new Date().getFullYear()} GlobeTrotter. All rights reserved.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Plain-text fallback for email clients that don't render HTML
// ---------------------------------------------------------------------------
export function buildRecoveryEmailText(resetUrl: string): string {
  return [
    'GlobeTrotter — Reset your password',
    '',
    'We received a request to reset the password for your GlobeTrotter account.',
    'Visit the link below to choose a new password. It expires in 30 minutes.',
    '',
    resetUrl,
    '',
    'If you didn\'t request this, you can safely ignore this email.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Provider factory — reads EMAIL_PROVIDER env var to pick implementation
// ---------------------------------------------------------------------------
function createEmailProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();

  switch (provider) {
    case 'smtp':
      return new SmtpEmailProvider();
    case 'console':
      return new ConsoleEmailProvider();
    default:
      console.warn(
        `[GlobeTrotter] Unknown EMAIL_PROVIDER "${provider}", falling back to console.`,
      );
      return new ConsoleEmailProvider();
  }
}

export const emailProvider: EmailProvider = createEmailProvider();
