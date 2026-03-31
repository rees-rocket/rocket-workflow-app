export const MAGIC_LINK_CHECK_INBOX_TEXT =
  "If the email does not show up right away, check spam, junk, or promotions.";

export const MAGIC_LINK_NEWEST_LINK_TEXT =
  "If multiple links were requested, use the newest email and wait for the resend cooldown before trying again.";

export const MAGIC_LINK_RATE_LIMIT_TEXT =
  "Email sends are rate-limited, so wait a few minutes before requesting another sign-in link.";

export function formatMagicLinkSuccessMessage(email?: string) {
  if (email) {
    return `Sign-in email sent to ${email}. Check spam/junk if it does not arrive right away.`;
  }

  return "Check your email for your sign-in link. If it does not arrive right away, check spam/junk.";
}

export function formatMagicLinkErrorMessage(message: string) {
  const normalized = message.trim();
  const lower = normalized.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "Too many sign-in emails were requested. Wait a few minutes before trying again, then use the newest email already sent.";
  }

  return normalized;
}
