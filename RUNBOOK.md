# Runbook

1. Edit `config/industry.yaml` for your industry, brand and offers.
2. `cp .env.example .env` and add keys. Keep `DRY_RUN=1` until outputs look right.
3. Install: `pip install -r requirements.txt`
4. Run: `python allinone_bot.py --brief "your brief"`
5. Review the printed output. Only then set `DRY_RUN=0`.
6. Approve actions at the gate. Nothing sends without your answer.

## Connector checklist
- [ ] Anthropic API key (required for live content)
- [ ] CRM (monday.com / HubSpot / Salesforce) account and login
- [ ] Gmail for follow-up drafts
- [ ] Canva or Figma for graphics
- [ ] Metricool or Typefully for scheduling
- [ ] Creatomate or Runway for video (confirm endpoint in their API docs)
- [ ] ElevenLabs voice ID
