# Premium release checklist

## Baseline
- [x] Existing GitHub Pages dashboard preserved.
- [x] Existing local-browser fallback retained.
- [x] Existing Node API retained for local/self-hosted testing.
- [x] Optional Cloudflare Worker API and D1 schema added.
- [x] Frontend can be configured for a separate API URL without exposing the token in source.
- [x] Worker checks allowed origin and requires a private bearer token for lead operations.

## Must be completed in the user's Cloudflare account
- [ ] Create D1 database and apply schema.
- [ ] Deploy Worker.
- [ ] Add private ADMIN_TOKEN secret and ALLOWED_ORIGIN variable.
- [ ] Configure dashboard API endpoint.
- [ ] Test health, login, lead create/list/update/delete from mobile browser.

## Explicitly not claimed as complete
- [ ] AI model provider connected.
- [ ] LinkedIn/Facebook official publishing and scheduling connected.
- [ ] Email/WhatsApp sending connected.
- [ ] Canva/Figma export connected.
- [ ] Production backup/restore and privacy process validated.
