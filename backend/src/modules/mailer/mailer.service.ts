import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('mailer.resendApiKey');
    this.fromEmail = this.configService.get<string>('mailer.fromEmail') ?? 'noreply@yourdomain.com';
    this.frontendUrl = this.configService.get<string>('mailer.frontendUrl') ?? 'http://localhost:5173';
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Verify your CarShares account',
        html: this.buildVerificationEmail(name, verifyUrl),
      });
      if ((result as any).error) {
        this.logger.error(`Resend API error sending verification email to ${to}: ${JSON.stringify((result as any).error)}`);
      } else {
        this.logger.log(`Verification email sent to ${to} (id: ${(result as any).data?.id})`);
      }
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${to}: ${JSON.stringify(err)}`);
      // Don't re-throw — user is already created; they can resend
    }
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Reset your CarShares password',
        html: this.buildPasswordResetEmail(name, resetUrl),
      });
      if ((result as any).error) {
        this.logger.error(`Resend API error sending reset email to ${to}: ${JSON.stringify((result as any).error)}`);
      } else {
        this.logger.log(`Password reset email sent to ${to} (id: ${(result as any).data?.id})`);
      }
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}: ${JSON.stringify(err)}`);
    }
  }

  // ─── Email Templates ─────────────────────────────────────────────────────

  private buildVerificationEmail(name: string, verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">CarShares</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Tokenized Vehicle Investment Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:22px;">Verify your email address</h2>
            <p style="margin:0 0 16px;color:#94a3b8;line-height:1.6;">Hi ${name},</p>
            <p style="margin:0 0 32px;color:#94a3b8;line-height:1.6;">
              Thanks for signing up! Please verify your email address to activate your account and start investing in tokenized vehicles.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${verifyUrl}" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link into your browser:</p>
            <p style="margin:0 0 32px;word-break:break-all;">
              <a href="${verifyUrl}" style="color:#3b82f6;font-size:13px;">${verifyUrl}</a>
            </p>
            <div style="border-top:1px solid #334155;padding-top:24px;">
              <p style="margin:0;color:#64748b;font-size:13px;">This link expires in <strong style="color:#94a3b8;">24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#0f172a;text-align:center;">
            <p style="margin:0;color:#475569;font-size:12px;">&copy; 2025 CarShares. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildPasswordResetEmail(name: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">CarShares</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Tokenized Vehicle Investment Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:22px;">Reset your password</h2>
            <p style="margin:0 0 16px;color:#94a3b8;line-height:1.6;">Hi ${name},</p>
            <p style="margin:0 0 32px;color:#94a3b8;line-height:1.6;">
              We received a request to reset your password. Click the button below to choose a new password.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${resetUrl}" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
                Reset Password
              </a>
            </div>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link into your browser:</p>
            <p style="margin:0 0 32px;word-break:break-all;">
              <a href="${resetUrl}" style="color:#3b82f6;font-size:13px;">${resetUrl}</a>
            </p>
            <div style="border-top:1px solid #334155;padding-top:24px;">
              <p style="margin:0;color:#64748b;font-size:13px;">This link expires in <strong style="color:#94a3b8;">30 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#0f172a;text-align:center;">
            <p style="margin:0;color:#475569;font-size:12px;">&copy; 2025 CarShares. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
