#!/usr/bin/env python3
"""Orchestrator for the Industry Automation Suite. Dry-run by default."""
import argparse, os, sys, json, yaml
from workflows.content import ContentStage
from workflows.approval import ApprovalStage
from workflows.pipeline_stages import (DesignStage, VideoStage, ScheduleStage,
    FollowUpStage, SalesCloseStage, ReportingStage)

def load_config(path="config/industry.yaml"):
    with open(path) as f:
        return yaml.safe_load(f)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--brief", required=True)
    p.add_argument("--config", default="config/industry.yaml")
    args = p.parse_args()

    dry_run = os.getenv("DRY_RUN", "1") != "0"
    cfg = load_config(args.config)
    print(f"Mode: {'DRY RUN (nothing sent)' if dry_run else 'LIVE'}")

    context = {"brief": args.brief, "pending_actions": []}
    result = ContentStage(cfg, dry_run).run(context)
    print(f"[{result.stage}] {result.message or 'ok'}")
    context.update(result.output)

    for stage in [DesignStage, VideoStage, ScheduleStage, FollowUpStage,
                  SalesCloseStage, ReportingStage]:
        r = stage(cfg, dry_run).run(context)
        print(f"[{r.stage}] {r.message or 'ok'}")
        context.update(r.output)

    approval = ApprovalStage(cfg, dry_run).run(context)
    print(f"[approval] approved {len(approval.output.get('approved', []))} action(s)")
    with open("reports/run_context.json", "w") as f:
        json.dump({k: v for k, v in context.items() if k != "prompt"}, f,
                  indent=2, ensure_ascii=False, default=str)

if __name__ == "__main__":
    sys.exit(main())
