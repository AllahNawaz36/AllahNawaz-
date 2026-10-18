#!/usr/bin/env python3
"""Orchestrator for the Industry Automation Suite. Dry-run by default."""
import argparse
import json
import os
import sys
from pathlib import Path

import yaml

from workflows.approval import ApprovalStage
from workflows.content import ContentStage
from workflows.pipeline_stages import (
    DesignStage,
    FollowUpStage,
    ReportingStage,
    SalesCloseStage,
    ScheduleStage,
    VideoStage,
)


def load_config(path: str) -> dict:
    config_path = Path(path)
    if not config_path.is_file():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    with config_path.open(encoding="utf-8") as handle:
        config = yaml.safe_load(handle)
    if not isinstance(config, dict):
        raise ValueError(f"Configuration file must contain a YAML object: {config_path}")
    for section in ("brand", "industry", "tools"):
        if not isinstance(config.get(section), dict):
            raise ValueError(f"Configuration is missing required '{section}' section")
    return config


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Naz Business Assistant workflow.")
    parser.add_argument("--brief", required=True, help="Short description of the content or task.")
    parser.add_argument("--config", default="config/industry.yaml", help="Path to brand YAML configuration.")
    args = parser.parse_args()

    dry_run = os.getenv("DRY_RUN", "1").strip() != "0"
    try:
        config = load_config(args.config)
    except (OSError, ValueError, yaml.YAMLError) as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 2

    print(f"Mode: {'DRY RUN (no external actions)' if dry_run else 'LIVE AI generation; publishing/email integrations remain disabled'}")
    context = {"brief": args.brief, "pending_actions": []}

    stages = [
        ContentStage(config, dry_run),
        DesignStage(config, dry_run),
        VideoStage(config, dry_run),
        ScheduleStage(config, dry_run),
        FollowUpStage(config, dry_run),
        SalesCloseStage(config, dry_run),
        ReportingStage(config, dry_run),
    ]
    for stage in stages:
        result = stage.run(context)
        print(f"[{result.stage}] {result.message or ('ok' if result.ok else 'failed')}")
        if not result.ok:
            print(f"Stage '{result.stage}' failed; stopping before later stages.", file=sys.stderr)
            return 1
        context.update(result.output)

    approval = ApprovalStage(config, dry_run).run(context)
    print(f"[approval] approved {len(approval.output.get('approved', []))} action(s)")
    if not approval.ok:
        print(f"Approval error: {approval.message}", file=sys.stderr)
        return 1

    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_path = reports_dir / "run_context.json"
    with report_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {key: value for key, value in context.items() if key != "prompt"},
            handle,
            indent=2,
            ensure_ascii=False,
            default=str,
        )
        handle.write("\n")
    print(f"Run context saved to {report_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
