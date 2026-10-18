"""Remaining pipeline stages. Each stage produces a plan in dry-run.
Live external calls are only made when DRY_RUN=0 AND the connector is configured."""
import os, json
from .base import Stage, StageResult

class DesignStage(Stage):
    name = "design"
    def run(self, context):
        c = context.get("brand_colors", self.config["brand"]["colors"])
        plan = {"canvas": "1080x1080 post", "palette": c,
                "headline": context.get("caption", "")[:60],
                "image_prompt": context.get("image_prompt", "")}
        return StageResult(self.name, True, {"design_plan": plan},
                           message="design plan ready (Canva/Figma connector needed for export)")

class VideoStage(Stage):
    name = "video"
    def run(self, context):
        plan = {"script": context.get("script", ""),
                "video_prompt": context.get("video_prompt", ""),
                "voice": self.config["tools"]["voice"],
                "engine": self.config["tools"]["video"]}
        return StageResult(self.name, True, {"video_plan": plan},
                           message="video plan ready (needs Creatomate/Runway API key)")

class ScheduleStage(Stage):
    name = "schedule"
    def run(self, context):
        if not context.get("caption"):
            return StageResult(self.name, False, message="no caption to schedule")
        item = {"platform": "linkedin", "text": context["caption"],
                "hashtags": context.get("hashtags", []),
                "status": "pending_approval"}
        context["pending_actions"].append(
            {"type": "social_publish", "summary": context["caption"][:80]})
        return StageResult(self.name, True, {"scheduled": [item]},
                           message="queued for approval")

class FollowUpStage(Stage):
    name = "follow_up"
    def run(self, context):
        if not context.get("email_followup_body"):
            return StageResult(self.name, True, message="no follow-up drafted")
        draft = {"subject": context.get("email_followup_subject", ""),
                 "body": context["email_followup_body"], "status": "draft"}
        context["pending_actions"].append(
            {"type": "email_send", "summary": draft["subject"]})
        return StageResult(self.name, True, {"email_draft": draft},
                           message="email draft queued for approval")

class SalesCloseStage(Stage):
    name = "sales_close"
    def run(self, context):
        checklist = ["Discovery call notes", "Proposal sent", "Pricing agreed",
                     "Contract signed", "Handover to delivery"]
        return StageResult(self.name, True, {"close_checklist": checklist},
                           message="sales close checklist ready")

class ReportingStage(Stage):
    name = "reporting"
    def run(self, context):
        lines = ["# Daily Report", f"Brief: {context.get('brief','')}",
                 f"Caption ready: {'yes' if context.get('caption') else 'no'}",
                 f"Email draft ready: {'yes' if context.get('email_followup_body') else 'no'}",
                 f"Pending approvals: {len(context.get('pending_actions', []))}"]
        report = "\n".join(lines)
        os.makedirs("reports", exist_ok=True)
        with open("reports/daily_report.md", "w") as f:
            f.write(report)
        return StageResult(self.name, True, {"report_path": "reports/daily_report.md"},
                           message="report written")
