import unittest
from workflows.content import ContentStage
from workflows.approval import ApprovalStage
from workflows.pipeline_stages import DesignStage, VideoStage, ScheduleStage, FollowUpStage, SalesCloseStage, ReportingStage

CONFIG = {
    "brand": {"name": "Test Brand", "tone": "clear", "voice_rules": ["honest"], "colors": {"primary": "#123456"}},
    "industry": {"sub_niche": "testing", "region": "Pakistan", "language": "English"},
    "tools": {"voice": "not-configured", "video": "plan-only"},
}

class WorkflowSmokeTests(unittest.TestCase):
    def test_dry_run_builds_prompt_without_api_key(self):
        result = ContentStage(CONFIG, dry_run=True).run({"brief": "Write a welcome post"})
        self.assertTrue(result.ok)
        self.assertIn("Write a welcome post", result.output["prompt"])

    def test_empty_approval_is_safe(self):
        result = ApprovalStage(CONFIG, dry_run=True).run({"pending_actions": []})
        self.assertTrue(result.ok)
        self.assertEqual(result.output["approved"], [])

    def test_planning_stages_do_not_send(self):
        context = {"brief": "Test", "pending_actions": []}
        for stage in (DesignStage, VideoStage, ScheduleStage, FollowUpStage, SalesCloseStage):
            result = stage(CONFIG, dry_run=True).run(context)
            self.assertTrue(result.ok, result.message)
        self.assertEqual(context["pending_actions"], [])

if __name__ == "__main__":
    unittest.main()
