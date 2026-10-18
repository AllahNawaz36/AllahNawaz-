# Runbook

## Dashboard and lead API
1. Use Node.js 18 or newer.
2. Set `ADMIN_TOKEN` in your terminal or hosting provider to a unique random secret of at least 32 characters.
3. Run `npm start`.
4. Open the app URL and use **Admin Login** in the Leads area with the same secret.
5. Confirm the public health endpoint returns JSON with `ok: true`: `/api/health`.
6. Never commit the real token. GitHub Pages cannot run the Node backend; use a Node.js host for the API.

## Python workflow (dry-run by default)
1. Edit `config/industry.yaml` for your brand, industry, language and tone.
2. Install dependencies: `python -m pip install -r requirements.txt`.
3. Run: `python allinone_bot.py --brief "your brief"`.
4. Review the generated prompt, plan and report in `reports/`.
5. The workflow does not publish social posts or send email. The approval gate records a choice only; actual provider integrations must be implemented and tested separately.

## AI content generation
- Set `ANTHROPIC_API_KEY` as a private environment variable.
- Verify the `CONTENT_MODEL` model ID is available to your provider account.
- Start with dry-run. Only set `DRY_RUN=0` when you intend to call the AI provider and understand any charges.
- Never store credentials in source control.

## Not implemented yet
- CRM provider connection, Gmail sending, LinkedIn/social publishing/scheduling
- Canva/Figma export, video generation or voice generation
- Live SEO crawling/rankings/keyword-volume data and analytics account connections
- Persistent database and backup/restore
