import { registerAs } from '@nestjs/config';

export default registerAs('mailer', () => ({
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  fromEmail: process.env.FROM_EMAIL ?? 'noreply@carshares.app',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
}));
