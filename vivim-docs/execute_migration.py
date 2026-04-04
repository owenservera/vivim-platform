#!/usr/bin/env python3
"""
Migration Execution Script for VIVIM Documentation

This script reads _migration_plan.json and executes the file migrations.
It creates destination directories as needed and moves files accordingly.

Usage:
    python execute_migration.py [--dry-run] [--verbose]

Options:
    --dry-run    Show what would be done without actually moving files
    --verbose    Show detailed output for each operation
"""

import json
import os
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple


class MigrationExecutor:
    def __init__(self, base_dir: str, dry_run: bool = False, verbose: bool = False):
        self.base_dir = Path(base_dir)
        self.dry_run = dry_run
        self.verbose = verbose
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "errors": []
        }
        self.created_dirs = set()
        
    def load_migration_plan(self, plan_path: str) -> Dict:
        """Load the migration plan JSON file."""
        with open(plan_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def ensure_directory_exists(self, dest_path: Path) -> bool:
        """Create destination directory if it doesn't exist."""
        parent = dest_path.parent
        if not parent.exists():
            if self.dry_run:
                if str(parent) not in self.created_dirs:
                    self.created_dirs.add(str(parent))
                    if self.verbose:
                        print(f"  [DRY-RUN] Would create directory: {parent}")
            else:
                parent.mkdir(parents=True, exist_ok=True)
                if self.verbose:
                    print(f"  Created directory: {parent}")
        return True
    
    def move_file(self, source: str, destination: str) -> Tuple[bool, str]:
        """
        Move a file from source to destination.
        Returns (success, message) tuple.
        """
        src_path = self.base_dir / source
        dest_path = self.base_dir / destination
        
        # Check if source exists
        if not src_path.exists():
            return False, f"Source file not found: {source}"
        
        # Check if destination already exists
        if dest_path.exists():
            return False, f"Destination already exists: {destination}"
        
        # Ensure destination directory exists
        self.ensure_directory_exists(dest_path)
        
        if self.dry_run:
            return True, f"Would move: {source} -> {destination}"
        
        # Perform the move
        try:
            shutil.move(str(src_path), str(dest_path))
            return True, f"Moved: {source} -> {destination}"
        except Exception as e:
            return False, f"Error moving file: {e}"
    
    def execute_migrations(self, migrations: List[Dict]) -> None:
        """Execute all migrations from the plan."""
        self.stats["total"] = len(migrations)
        
        print(f"\n{'='*70}")
        print(f"Migration Execution {'(DRY-RUN)' if self.dry_run else ''}")
        print(f"{'='*70}")
        print(f"Total files to migrate: {len(migrations)}")
        print(f"Base directory: {self.base_dir}")
        print(f"{'='*70}\n")
        
        for i, migration in enumerate(migrations, 1):
            source = migration.get("source", "")
            destination = migration.get("destination", "")
            action = migration.get("action", "move")
            
            if self.verbose:
                print(f"\n[{i}/{len(migrations)}] {source}")
                print(f"    -> {destination}")
            
            # Skip if action is not 'move'
            if action != "move":
                if self.verbose:
                    print(f"    Skipped (action: {action})")
                self.stats["skipped"] += 1
                continue
            
            # Execute the move
            success, message = self.move_file(source, destination)
            
            if success:
                self.stats["success"] += 1
                if self.verbose:
                    print(f"    ✓ {message}")
            else:
                self.stats["failed"] += 1
                self.stats["errors"].append({
                    "source": source,
                    "destination": destination,
                    "error": message
                })
                if not self.verbose:
                    print(f"[{i}/{len(migrations)}] ✗ {message}")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self) -> None:
        """Print migration summary."""
        print(f"\n{'='*70}")
        print("Migration Summary")
        print(f"{'='*70}")
        print(f"  Total files:     {self.stats['total']}")
        print(f"  Successful:      {self.stats['success']}")
        print(f"  Failed:          {self.stats['failed']}")
        print(f"  Skipped:         {self.stats['skipped']}")
        
        if self.dry_run:
            print(f"\n  [DRY-RUN] No files were actually moved.")
        
        if self.stats["errors"]:
            print(f"\n  Errors ({len(self.stats['errors'])}):")
            for err in self.stats["errors"][:10]:  # Show first 10 errors
                print(f"    - {err['source']}: {err['error']}")
            if len(self.stats["errors"]) > 10:
                print(f"    ... and {len(self.stats['errors']) - 10} more errors")
        
        print(f"{'='*70}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Execute documentation migration plan",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python execute_migration.py              # Execute migration
  python execute_migration.py --dry-run    # Preview what would happen
  python execute_migration.py -v           # Verbose output
        """
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without actually moving files"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Show detailed output for each operation"
    )
    parser.add_argument(
        "--plan",
        default="_migration_plan.json",
        help="Path to migration plan JSON file (default: _migration_plan.json)"
    )
    
    args = parser.parse_args()
    
    # Get script directory as base
    base_dir = Path(__file__).parent
    
    # Load migration plan
    plan_path = base_dir / args.plan
    if not plan_path.exists():
        print(f"Error: Migration plan not found: {plan_path}")
        return 1
    
    print(f"Loading migration plan from: {plan_path}")
    
    try:
        plan = json.load(open(plan_path, 'r', encoding='utf-8'))
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return 1
    
    # Execute migrations
    executor = MigrationExecutor(
        base_dir=str(base_dir),
        dry_run=args.dry_run,
        verbose=args.verbose
    )
    
    migrations = plan.get("migrations", [])
    if not migrations:
        print("No migrations found in plan.")
        return 0
    
    executor.execute_migrations(migrations)
    
    # Save execution log
    if not args.dry_run:
        log_path = base_dir / f"migration_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(executor.stats, f, indent=2)
        print(f"Execution log saved to: {log_path}")
    
    return 0 if executor.stats["failed"] == 0 else 1


if __name__ == "__main__":
    exit(main())
