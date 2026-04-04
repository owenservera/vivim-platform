#!/usr/bin/env python3
"""
Script to find duplicate markdown files in the vivim-docs directory.
Identifies duplicates by filename (case-insensitive) and outputs full paths.
"""

import os
from pathlib import Path
from collections import defaultdict

def find_duplicate_markdown_files(root_dir):
    """Find all duplicate .md files by filename."""
    
    # Dictionary to store files grouped by lowercase filename
    files_by_name = defaultdict(list)
    
    # Walk through all subdirectories
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith('.md'):
                full_path = os.path.abspath(os.path.join(dirpath, filename))
                # Use lowercase filename as key for comparison
                key = filename.lower()
                files_by_name[key].append(full_path)
    
    # Filter to only keep entries with duplicates (more than 1 file)
    duplicates = {k: v for k, v in files_by_name.items() if len(v) > 1}
    
    return duplicates, files_by_name

def main():
    # Get the root directory (script's parent directory)
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Scanning for duplicate markdown files in:\n{root_dir}\n")
    print("=" * 80)
    
    duplicates, all_files = find_duplicate_markdown_files(root_dir)
    
    if duplicates:
        print(f"\n🔴 FOUND {len(duplicates)} DUPLICATE FILENAME(S):\n")
        
        for i, (filename, paths) in enumerate(sorted(duplicates.items()), 1):
            print(f"\n{i}. [{filename}]")
            print("-" * 60)
            for path in sorted(paths):
                print(f"   → {path}")
    else:
        print("\n✅ No duplicate filenames found!")
    
    # Summary statistics
    print("\n" + "=" * 80)
    print(f"\n📊 SUMMARY:")
    print(f"   Total .md files scanned: {sum(len(v) for v in all_files.values())}")
    print(f"   Unique filenames: {len(all_files)}")
    print(f"   Duplicate groups: {len(duplicates)}")
    if duplicates:
        total_duplicates = sum(len(paths) for paths in duplicates.values())
        print(f"   Total files with duplicate names: {total_duplicates}")

if __name__ == "__main__":
    main()
