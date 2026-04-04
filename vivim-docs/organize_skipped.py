#!/usr/bin/env python3
"""
Skipped Files Organizer for VIVIM Documentation Migration

This script helps organize the 184 files that were skipped during the initial
migration. It provides interactive and batch modes for handling files with
actions: "promote", "archive", and "review".

Usage:
    python organize_skipped.py [--mode MODE] [--batch] [--output FILE]

Modes:
    interactive  - Step through each file and choose destination (default)
    report       - Generate a detailed report of skipped files
    auto         - Automatically move files based on suggested destinations
"""

import json
import os
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import Counter


@dataclass
class SkippedFile:
    source: str
    destination: str
    action: str
    reason: str
    confidence: str
    word_count: Optional[int] = None
    heading: Optional[str] = None


class SkippedFilesOrganizer:
    # Valid destination categories
    CATEGORIES = [
        "01-PLATFORM/architecture",
        "01-PLATFORM/database",
        "01-PLATFORM/context-engine",
        "01-PLATFORM/acu-system",
        "02-PRODUCT/features",
        "02-PRODUCT/roadmap",
        "02-PRODUCT/ux-design",
        "02-PRODUCT/demos",
        "03-FRONTEND/components",
        "03-FRONTEND/design-system",
        "03-FRONTEND/ux-design",
        "03-FRONTEND/pwa",
        "04-NETWORK-SDK/sdk",
        "04-NETWORK-SDK/p2p-network",
        "04-NETWORK-SDK/blockchain",
        "05-SECURITY/privacy",
        "05-SECURITY/chain-of-trust",
        "05-SECURITY/zero-trust",
        "06-RESEARCH/sovereign-memory",
        "06-RESEARCH/detection-algorithms",
        "06-RESEARCH/mathematics",
        "07-BUSINESS/open-source",
        "07-BUSINESS/website",
        "07-BUSINESS/operations",
        "07-BUSINESS/strategy",
        "07-BUSINESS/pitch-investor",
        "08-ARCHIVE",
        "08-ARCHIVE/duplicates",
        "_working",
    ]
    
    def __init__(self, base_dir: str, plan_path: str):
        self.base_dir = Path(base_dir)
        self.plan_path = Path(plan_path)
        self.skipped_files: List[SkippedFile] = []
        self.stats = {
            "total": 0,
            "processed": 0,
            "moved": 0,
            "failed": 0,
            "actions": Counter()
        }
        
    def load_skipped_files(self) -> List[SkippedFile]:
        """Load skipped files from migration plan."""
        with open(self.plan_path, 'r', encoding='utf-8') as f:
            plan = json.load(f)
        
        migrations = plan.get("migrations", [])
        self.skipped_files = [
            SkippedFile(
                source=m.get("source", ""),
                destination=m.get("destination", ""),
                action=m.get("action", ""),
                reason=m.get("reason", ""),
                confidence=m.get("confidence", ""),
                word_count=m.get("word_count"),
                heading=m.get("heading")
            )
            for m in migrations
            if m.get("action") in ("promote", "archive", "review")
        ]
        
        # Filter to only files that still exist
        self.skipped_files = [
            f for f in self.skipped_files
            if (self.base_dir / f.source).exists()
        ]
        
        self.stats["total"] = len(self.skipped_files)
        self.stats["actions"] = Counter(f.action for f in self.skipped_files)
        
        return self.skipped_files
    
    def scan_remaining_files(self) -> List[SkippedFile]:
        """Scan for files that still need to be organized."""
        # Directories that were sources in the original plan
        source_dirs = [
            "VIVIM.docs/.archive/current",
            "VIVIM.docs/.archive/old",
            "VIVIM.docs/.archive/dev",
            "VIVIM.docs/.archive",
            "VIVIM.docs/vivim-app-legacy",
            "VIVIM.docs/vivim.docs.context/docs/_legacy",
            "VIVIM.docs/NETWORK/.current",
            "VIVIM.docs/CONTEXT/.original",
            "VIVIM.docs/ACU",
            "chain-of-trust",
            "OpenCore",
            "VIVIM.docs/BIZ",
            "VIVIM.docs/PITCH",
            "VIVIM.docs/vivim-live",
            "VIVIM.docs/OPENsource",
        ]
        
        remaining = []
        for src_dir in source_dirs:
            dir_path = self.base_dir / src_dir.replace("/", "\\")
            if dir_path.exists():
                for md_file in dir_path.rglob("*.md"):
                    rel_path = md_file.relative_to(self.base_dir)
                    # Determine suggested destination based on path
                    if "archive" in str(rel_path).lower() or "legacy" in str(rel_path).lower():
                        dest = f"08-ARCHIVE/{md_file.name}"
                        action = "archive"
                    elif "chain-of-trust" in str(rel_path):
                        dest = f"08-ARCHIVE/duplicates/{md_file.name}"
                        action = "archive"
                    else:
                        dest = f"08-ARCHIVE/{md_file.name}"
                        action = "review"
                    
                    remaining.append(SkippedFile(
                        source=str(rel_path),
                        destination=dest,
                        action=action,
                        reason="Scanned from remaining source directories",
                        confidence="medium"
                    ))
        
        return remaining
    
    def generate_report(self, output_path: Optional[str] = None) -> str:
        """Generate a detailed report of skipped files."""
        report_lines = [
            "=" * 80,
            "SKIPPED FILES REPORT",
            "=" * 80,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Total skipped files: {self.stats['total']}",
            "",
            "Breakdown by action:",
        ]
        
        for action, count in self.stats["actions"].items():
            report_lines.append(f"  - {action}: {count} files")
        
        report_lines.extend([
            "",
            "=" * 80,
            "FILES BY ACTION",
            "=" * 80,
        ])
        
        # Group by action
        by_action = {}
        for f in self.skipped_files:
            if f.action not in by_action:
                by_action[f.action] = []
            by_action[f.action].append(f)
        
        for action in sorted(by_action.keys()):
            files = by_action[action]
            report_lines.extend([
                "",
                f"--- {action.upper()} ({len(files)} files) ---",
                ""
            ])
            
            for i, f in enumerate(files, 1):
                source_file = self.base_dir / f.source
                exists = "✓" if source_file.exists() else "✗"
                report_lines.append(
                    f"[{i:3d}] {exists} {f.source}"
                )
                report_lines.append(f"       → {f.destination}")
                report_lines.append(f"       Reason: {f.reason}")
                if f.heading:
                    report_lines.append(f"       Heading: {f.heading[:60]}...")
                report_lines.append("")
        
        report = "\n".join(report_lines)
        
        if output_path:
            output_file = Path(output_path)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to: {output_file}")
        
        return report
    
    def move_file(self, source: str, destination: str) -> Tuple[bool, str]:
        """Move a file from source to destination."""
        src_path = self.base_dir / source
        dest_path = self.base_dir / destination
        
        if not src_path.exists():
            return False, f"Source not found: {source}"
        
        if dest_path.exists():
            return False, f"Destination exists: {destination}"
        
        # Ensure destination directory exists
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            shutil.move(str(src_path), str(dest_path))
            return True, f"Moved: {source} → {destination}"
        except Exception as e:
            return False, f"Error: {e}"
    
    def interactive_mode(self) -> None:
        """Interactive mode for organizing files one by one."""
        print("\n" + "=" * 80)
        print("INTERACTIVE MODE - Organize Skipped Files")
        print("=" * 80)
        print(f"Total files to process: {len(self.skipped_files)}")
        print("\nCommands:")
        print("  [1-9] Move to numbered destination")
        print("  m     Manual destination path")
        print("  s     Skip this file")
        print("  q     Quit and save progress")
        print("  ?     Show category list")
        print("=" * 80 + "\n")
        
        for i, file in enumerate(self.skipped_files, 1):
            src_path = self.base_dir / file.source
            
            if not src_path.exists():
                print(f"\n[{i}/{len(self.skipped_files)}] ✗ Source not found: {file.source}")
                self.stats["failed"] += 1
                continue
            
            print(f"\n[{i}/{len(self.skipped_files)}] {file.source}")
            print(f"    Current action: {file.action}")
            print(f"    Suggested: {file.destination}")
            print(f"    Reason: {file.reason[:70]}...")
            if file.heading:
                print(f"    Heading: {file.heading[:60]}")
            
            # Show quick category options
            print("\n    Quick destinations:")
            for idx, cat in enumerate(self.CATEGORIES[:9], 1):
                print(f"      [{idx}] {cat}")
            print(f"      [m] Manual path  [s] Skip  [q] Quit  [?] More categories")
            
            while True:
                choice = input("\n    Your choice: ").strip().lower()
                
                if choice == "q":
                    print("\nSaving progress...")
                    self.save_progress(i)
                    return
                
                if choice == "s":
                    print("    → Skipped")
                    break
                
                if choice == "?":
                    print("\n    All categories:")
                    for idx, cat in enumerate(self.CATEGORIES, 1):
                        print(f"      [{idx:2d}] {cat}")
                    continue
                
                if choice == "m":
                    manual_dest = input("    Enter destination path (relative to base): ").strip()
                    if manual_dest:
                        success, msg = self.move_file(file.source, manual_dest)
                        if success:
                            print(f"    ✓ {msg}")
                            self.stats["moved"] += 1
                        else:
                            print(f"    ✗ {msg}")
                            self.stats["failed"] += 1
                    break
                
                try:
                    idx = int(choice) - 1
                    if 0 <= idx < len(self.CATEGORIES):
                        category = self.CATEGORIES[idx]
                        filename = Path(file.source).name
                        destination = f"{category}/{filename}"
                        
                        success, msg = self.move_file(file.source, destination)
                        if success:
                            print(f"    ✓ {msg}")
                            self.stats["moved"] += 1
                        else:
                            print(f"    ✗ {msg}")
                            self.stats["failed"] += 1
                        break
                    else:
                        print("    Invalid number. Try again.")
                except ValueError:
                    print("    Invalid input. Try again.")
            
            self.stats["processed"] += 1
            
            # Save progress every 10 files
            if i % 10 == 0:
                self.save_progress(i)
        
        print("\n" + "=" * 80)
        print("Interactive session complete!")
        self.print_summary()
    
    def auto_mode(self, dry_run: bool = True, action_filter: Optional[str] = None) -> None:
        """Automatically move files based on suggested destinations."""
        print("\n" + "=" * 80)
        print("AUTO MODE - Processing skipped files")
        print(f"Dry run: {dry_run}")
        if action_filter:
            print(f"Filter: action={action_filter}")
        print("=" * 80 + "\n")
        
        files_to_process = self.skipped_files
        if action_filter:
            files_to_process = [f for f in self.skipped_files if f.action == action_filter]
            print(f"Files matching action '{action_filter}': {len(files_to_process)}\n")
        
        for i, file in enumerate(files_to_process, 1):
            src_path = self.base_dir / file.source
            
            if not src_path.exists():
                print(f"[{i}/{len(files_to_process)}] ✗ Source not found: {file.source}")
                self.stats["failed"] += 1
                continue
            
            if file.action == "review":
                print(f"[{i}/{len(files_to_process)}] ⚠ Review required: {file.source}")
                self.stats["failed"] += 1
                continue
            
            # Use suggested destination
            success, msg = self.move_file(file.source, file.destination)
            
            if success:
                print(f"[{i}/{len(files_to_process)}] ✓ {msg}")
                self.stats["moved"] += 1
            else:
                print(f"[{i}/{len(files_to_process)}] ✗ {msg}")
                self.stats["failed"] += 1
            
            self.stats["processed"] += 1
        
        self.print_summary()
        self.save_progress(len(self.skipped_files))
    
    def batch_by_action(self, dry_run: bool = True) -> None:
        """Process files in batches by action type."""
        print("\n" + "=" * 80)
        print("BATCH MODE - Processing files by action type")
        print("=" * 80 + "\n")
        
        # Process 'archive' files first (safest)
        print("\n>>> Processing 'archive' action files...\n")
        self.auto_mode(dry_run=dry_run, action_filter="archive")
        
        # Then 'promote' files
        print("\n>>> Processing 'promote' action files...\n")
        self.auto_mode(dry_run=dry_run, action_filter="promote")
        
        # Leave 'review' files for manual handling
        print("\n>>> 'review' action files require manual handling")
        review_files = [f for f in self.skipped_files if f.action == "review"]
        for f in review_files:
            print(f"  - {f.source}")
    
    def save_progress(self, processed_count: int) -> None:
        """Save progress to a JSON file."""
        progress = {
            "timestamp": datetime.now().isoformat(),
            "processed": processed_count,
            "stats": dict(self.stats),
            "remaining": [
                {
                    "source": f.source,
                    "destination": f.destination,
                    "action": f.action
                }
                for f in self.skipped_files[processed_count:]
            ]
        }
        
        progress_path = self.base_dir / "skipped_files_progress.json"
        with open(progress_path, 'w', encoding='utf-8') as f:
            json.dump(progress, f, indent=2, ensure_ascii=False)
        
        print(f"\nProgress saved to: skipped_files_progress.json")
    
    def print_summary(self) -> None:
        """Print summary statistics."""
        print("\n" + "=" * 80)
        print("Summary")
        print("=" * 80)
        print(f"  Total:      {self.stats['total']}")
        print(f"  Processed:  {self.stats['processed']}")
        print(f"  Moved:      {self.stats['moved']}")
        print(f"  Failed:     {self.stats['failed']}")
        print(f"  Remaining:  {self.stats['total'] - self.stats['processed']}")
        print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Organize skipped files from VIVIM documentation migration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python organize_skipped.py                              # Interactive mode
  python organize_skipped.py --mode report                # Generate report
  python organize_skipped.py --mode report -o report.txt  # Save report to file
  python organize_skipped.py --mode auto --batch          # Batch process all (dry-run)
  python organize_skipped.py --mode auto --batch --execute  # Batch process all (actual)
  python organize_skipped.py --mode auto --action archive # Process only 'archive' files
  python organize_skipped.py --mode auto --action promote --execute  # Move 'promote' files
        """
    )
    
    parser.add_argument(
        "--mode",
        choices=["interactive", "report", "auto"],
        default="interactive",
        help="Operation mode (default: interactive)"
    )
    
    parser.add_argument(
        "--plan",
        default="_migration_plan.json",
        help="Path to migration plan JSON file"
    )
    
    parser.add_argument(
        "--output",
        help="Output file for report mode"
    )
    
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually move files (for auto mode)"
    )
    
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Process files in batches by action type (archive first, then promote)"
    )
    
    parser.add_argument(
        "--action",
        choices=["promote", "archive", "review"],
        help="Process only files with specific action"
    )
    
    parser.add_argument(
        "--scan",
        action="store_true",
        help="Scan for remaining files in source directories (ignores migration plan)"
    )
    
    args = parser.parse_args()
    
    base_dir = Path(__file__).parent
    plan_path = base_dir / args.plan
    
    if not plan_path.exists():
        print(f"Error: Migration plan not found: {plan_path}")
        return 1
    
    organizer = SkippedFilesOrganizer(str(base_dir), str(plan_path))
    
    print("Loading skipped files...")
    
    if args.scan:
        print("Scanning for remaining files in source directories...")
        skipped = organizer.scan_remaining_files()
        organizer.skipped_files = skipped
        organizer.stats["total"] = len(skipped)
        organizer.stats["actions"] = Counter(f.action for f in skipped)
    else:
        skipped = organizer.load_skipped_files()
    
    if not skipped:
        print("No skipped files found.")
        return 0
    
    print(f"Found {len(skipped)} skipped files")
    print(f"Actions: {dict(organizer.stats['actions'])}")
    
    if args.mode == "report":
        organizer.generate_report(args.output)
        return 0
    
    elif args.mode == "auto":
        if args.execute:
            confirm = input("\n⚠️  This will actually move files. Continue? (yes/no): ")
            if confirm.lower() != "yes":
                print("Aborted.")
                return 0
        
        if args.batch:
            organizer.batch_by_action(dry_run=not args.execute)
        elif args.action:
            organizer.auto_mode(dry_run=not args.execute, action_filter=args.action)
        else:
            organizer.auto_mode(dry_run=not args.execute)
        return 0
    
    elif args.mode == "interactive":
        organizer.interactive_mode()
        return 0
    
    return 0


if __name__ == "__main__":
    exit(main())
