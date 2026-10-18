"""Approval gate. Nothing external happens without an explicit yes."""
from .base import Stage, StageResult

class ApprovalStage(Stage):
    name = "approval"

    def run(self, context: dict) -> StageResult:
        actions = context.get("pending_actions", [])
        if not actions:
            return StageResult(self.name, True, {"approved": []}, message="nothing to approve")
        print("\nPending actions (none will run without approval):")
        for i, action in enumerate(actions, 1):
            print(f"  {i}. [{action['type']}] {action['summary']}")
        if self.dry_run:
            return StageResult(self.name, True, {"approved": []}, message="dry run: skipped")
        choice = input("Approve which? (all / numbers e.g. 1,3 / none): ").strip().lower()
        if choice in ("", "none"):
            return StageResult(self.name, True, {"approved": []}, message="none approved")
        if choice == "all":
            approved = actions
        else:
            indices = set()
            for part in choice.split(","):
                part = part.strip()
                if not part.isdigit() or int(part) < 1 or int(part) > len(actions):
                    return StageResult(self.name, False, {"approved": []}, message="invalid selection; nothing approved")
                indices.add(int(part) - 1)
            approved = [action for i, action in enumerate(actions) if i in indices]
        return StageResult(self.name, True, {"approved": approved})
