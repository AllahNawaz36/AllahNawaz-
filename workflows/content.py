"""Content stage: builds a brand-aware prompt and optionally calls Anthropic."""
import json
import os
from .base import Stage, StageResult

PROMPT = """You are a content strategist for {brand}, a {niche} practice.
Tone: {tone}. Rules: {rules}. Audience region: {region}. Language: {language}.
Brief: {brief}
Return ONLY valid JSON with keys: script, caption, hashtags (list), video_prompt, image_prompt, email_followup_subject, email_followup_body."""

class ContentStage(Stage):
    name = "content"

    def run(self, context: dict) -> StageResult:
        cfg = self.config
        try:
            prompt = PROMPT.format(
                brand=cfg["brand"]["name"],
                niche=cfg["industry"]["sub_niche"],
                tone=cfg["brand"]["tone"],
                rules="; ".join(cfg["brand"]["voice_rules"]),
                region=cfg["industry"]["region"],
                language=cfg["industry"]["language"],
                brief=context["brief"],
            )
        except (KeyError, TypeError) as exc:
            return StageResult(self.name, False, message=f"Configuration field missing or invalid: {exc}")
        if self.dry_run:
            return StageResult(self.name, True, {"prompt": prompt}, message="dry run: prompt built; no AI request sent")
        try:
            import anthropic
            client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from environment
            msg = client.messages.create(
                model=os.getenv("CONTENT_MODEL", "claude-sonnet-4-5"),
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )
            data = json.loads(msg.content[0].text)
            required = {"script", "caption", "hashtags", "video_prompt", "image_prompt", "email_followup_subject", "email_followup_body"}
            if not isinstance(data, dict) or not required.issubset(data):
                raise ValueError("AI response JSON is missing required keys")
            if not isinstance(data["hashtags"], list):
                raise ValueError("AI response 'hashtags' must be a list")
            return StageResult(self.name, True, data)
        except Exception as exc:
            return StageResult(self.name, False, message=f"Content generation failed: {type(exc).__name__}: {exc}")
