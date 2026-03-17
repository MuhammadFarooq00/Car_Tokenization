import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env['JWT_SECRET'];
  const refreshSecret = process.env['JWT_REFRESH_SECRET'];

  if (process.env['NODE_ENV'] === 'production') {
    if (!secret) throw new Error('JWT_SECRET must be set in production');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET must be set in production');
  }

  return {
    secret: secret || 'fallback-secret-do-not-use-in-production',
    refreshSecret: refreshSecret || 'fallback-refresh-secret',
    expiration: process.env['JWT_EXPIRATION'] || '15m',
    refreshExpiration: process.env['JWT_REFRESH_EXPIRATION'] || '7d',
  };
});
