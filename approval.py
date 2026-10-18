"""Approval gate. Nothing external happens without an explicit yes."""
from .base import Stage, StageResult

class ApprovalStage(Stage):
    name = "approval"

    def run(self, context: dict) -> StageResult:
        actions = context.get("pending_actions", [])
        if not actions:
            return StageResult(self.name, True, message="nothing to approve")
        print("\nPending actions (none will run without approval):")
        for i, a in enumerate(actions, 1):
            print(f"  {i}. [{a['type']}] {a['summary']}")
        if self.dry_run:
            return StageResult(self.name, True, {"approved": []}, message="dry run: skipped")
        choice = input("Approve which? (all / numbers e.g. 1,3 / none): ").strip().lower()
        if choice in ("", "none"):
            return StageResult(self.name, True, {"approved": []})
        if choice == "all":
            approved = actions
        else:
            idx = {int(x) - 1 for x in choice.split(",") if x.strip().isdigit()}
            approved = [a for i, a in enumerate(actions) if i in idx]
        return StageResult(self.name, True, {"approved": approved})
