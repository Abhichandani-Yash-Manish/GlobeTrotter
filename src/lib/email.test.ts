import { describe, expect, it } from 'vitest';
import { buildRecoveryEmailHtml, buildRecoveryEmailText } from '@/lib/email';

describe('password recovery email', () => {
  it('includes an accessible HTML action and the plain-text fallback', () => {
    const resetUrl = 'https://example.com/reset-password?token=abc123';
    expect(buildRecoveryEmailHtml(resetUrl)).toContain(`href="${resetUrl}"`);
    expect(buildRecoveryEmailHtml(resetUrl)).toContain('30 minutes');
    expect(buildRecoveryEmailText(resetUrl)).toContain(resetUrl);
  });

  it('escapes recovery URLs before placing them in HTML', () => {
    const html = buildRecoveryEmailHtml('https://example.com/reset?token=a&next=\"<unsafe>');
    expect(html).toContain('a&amp;next=&quot;&lt;unsafe&gt;');
    expect(html).not.toContain('\"<unsafe>');
  });
});
