import { describe, it, expect } from 'vitest';
import { verifySmtpConnection } from '@/lib/email';

describe('SMTP server', () => {
  it('exposes verifySmtpConnection', () => {
    expect(typeof verifySmtpConnection).toBe('function');
  });

  it.skipIf(process.env.RUN_SMTP_INTEGRATION !== '1')(
    'connects to configured SMTP (nodemailer verify)',
    async () => {
      const result = await verifySmtpConnection();
      expect(result).toEqual({ ok: true });
    }
  );
});
