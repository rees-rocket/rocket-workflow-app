import {
  MAGIC_LINK_CHECK_INBOX_TEXT,
  MAGIC_LINK_NEWEST_LINK_TEXT,
  MAGIC_LINK_RATE_LIMIT_TEXT
} from "@/lib/magic-link";

type MagicLinkHelpProps = {
  title?: string;
};

export function MagicLinkHelp({
  title = "Sign-in email tips"
}: MagicLinkHelpProps) {
  return (
    <div className="screen-frame stack">
      <strong>{title}</strong>
      <p className="muted">{MAGIC_LINK_CHECK_INBOX_TEXT}</p>
      <p className="muted">{MAGIC_LINK_NEWEST_LINK_TEXT}</p>
      <p className="muted">{MAGIC_LINK_RATE_LIMIT_TEXT}</p>
    </div>
  );
}
