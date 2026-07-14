# Security Operations

## Login attempt handling

`components/LoginForm.tsx` has a 30-second pause after five consecutive failed attempts. This is a client-side user experience aid only. It uses React state and is reset by a page reload; it can also be bypassed with a private window, another device, or direct calls to Supabase Auth. It must not be described as a server-side lockout or an account protection control.

The application returns the same login failure message for an unknown email address and an incorrect password. This reduces account enumeration from the normal login screen.

## Production baseline

Before public production use:

1. Review Supabase Dashboard > Authentication > Rate Limits.
2. Enable Cloudflare Turnstile or hCaptcha in Authentication > Bot and Abuse Protection, and add the matching frontend challenge before enabling the setting for users.
3. Monitor Supabase Auth audit logs and 429 responses for sustained authentication abuse.

Supabase Rate Limits and CAPTCHA are the primary protections for the current browser-direct password login. The client-side 30-second pause is supplemental only.

## Future server-side login limiter

If password login is moved behind a JC-App Route Handler, use a shared server-side store such as Redis. Do not use in-memory counters because they are lost on restart and are not shared across Vercel instances.

- Key attempts by a keyed hash of normalized email plus client IP, not by IP alone.
- Maintain separate limits for the email/IP pair and the IP across many emails.
- Use an explicit expiry and exponential cooldown. A reasonable starting point is five failures per email/IP pair in 15 minutes, with a 15-minute initial cooldown.
- Reset the email/IP failure counter only after a successful password login.
- Return the same generic error for an invalid credential and a temporarily blocked login; do not disclose whether an email exists.
- Treat forwarded client IP headers as trusted only when the hosting proxy is known and configured. Never accept an arbitrary client-supplied IP header as authoritative.
