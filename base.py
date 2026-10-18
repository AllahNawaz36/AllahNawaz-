"""Base stage contract. Every workflow stage implements run()."""
from dataclasses import dataclass, field

@dataclass
class StageResult:
    stage: str
    ok: bool
    output: dict = field(default_factory=dict)
    needs_approval: bool = False
    message: str = ""

class Stage:
    name: str = "base"

    def __init__(self, config: dict, dry_run: bool = True):
        self.config = config
        self.dry_run = dry_run

    def run(self, context: dict) -> StageResult:
        raise NotImplementedError
