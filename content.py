"""Content stage: turns a brief into script, caption and prompts using the brand config."""
import json, os
from .base import Stage, StageResult

PROMPT = """You are a content strategist for {brand}, a {niche} practice.
Tone: {tone}. Rules: {rules}. Audience region: {region}. Language: {language}.
Brief: {brief}
Return ONLY valid JSON with keys: script, caption, hashtags (list), video_prompt, image_prompt, email_followup_subject, email_followup_body."""

class ContentStage(Stage):
    name = "content"

    def run(self, context: dict) -> StageResult:
        cfg = self.config
        prompt = PROMPT.format(
            brand=cfg["brand"]["name"],
            niche=cfg["industry"]["sub_niche"],
            tone=cfg["brand"]["tone"],
            rules="; ".join(cfg["brand"]["voice_rules"]),
            region=cfg["industry"]["region"],
            language=cfg["industry"]["language"],
            brief=context["brief"],
        )
        if self.dry_run:
            return StageResult(self.name, True, {"prompt": prompt}, message="dry run: prompt built")
        import anthropic
        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
        msg = client.messages.create(
            model=os.getenv("CONTENT_MODEL", "claude-sonnet-4-5"),
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(msg.content[0].text)
        return StageResult(self.name, True, data)
