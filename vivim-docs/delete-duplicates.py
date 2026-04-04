#!/usr/bin/env python3
"""
Script to delete duplicate markdown files, keeping only one copy of each.
Priority: keeps files from shallower directory paths, deletes from deeper nested folders.
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
    
    return duplicates

def get_path_depth(path):
    """Count the number of directory levels in a path."""
    return path.count(os.sep)

def select_file_to_keep(paths):
    """
    Select which file to keep based on priority rules:
    1. Prefer shallower paths (less nested)
    2. Prefer paths without 'archive' or '.old' in the name
    3. Prefer paths without 'VIVIM.docs' repetition
    4. If tie, keep the first one alphabetically
    """
    def priority_key(path):
        depth = get_path_depth(path)
        path_lower = path.lower()
        
        # Penalties for undesirable path characteristics
        has_archive = 1 if 'archive' in path_lower or '.old' in path_lower else 0
        has_vivim_repetition = 1 if 'vivim.docs\\vivim.docs' in path_lower.replace('/', '\\') else 0
        has_legacy = 1 if '_legacy' in path_lower else 0
        has_context_original = 1 if 'context\\.original' in path_lower.replace('/', '\\') else 0
        
        return (depth, has_archive, has_vivim_repetition, has_legacy, has_context_original, path)
    
    sorted_paths = sorted(paths, key=priority_key)
    return sorted_paths[0], sorted_paths[1:]

def main():
    # Get the root directory (script's parent directory)
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Scanning for duplicate markdown files in:\n{root_dir}\n")
    print("=" * 80)
    
    duplicates = find_duplicate_markdown_files(root_dir)
    
    if not duplicates:
        print("\n✅ No duplicate filenames found!")
        return
    
    total_files_to_delete = 0
    deleted_count = 0
    failed_deletions = []
    
    # First pass: calculate what will be deleted
    print("\n📋 FILES TO BE DELETED:\n")
    
    for filename, paths in sorted(duplicates.items()):
        keep_path, delete_paths = select_file_to_keep(paths)
        total_files_to_delete += len(delete_paths)
    
    print(f"Total duplicate files to delete: {total_files_to_delete}\n")
    
    # Confirm before deletion
    print("⚠️  WARNING: This will permanently delete files!")
    response = input("\nType 'DELETE' to confirm: ").strip()
    
    if response != 'DELETE':
        print("\n❌ Operation cancelled.")
        return
    
    print("\n" + "=" * 80)
    print("\n🗑️  DELETING DUPLICATES:\n")
    
    # Second pass: actually delete
    for i, (filename, paths) in enumerate(sorted(duplicates.items()), 1):
        keep_path, delete_paths = select_file_to_keep(paths)
        
        print(f"\n{i}. [{filename}]")
        print(f"   ✓ KEEP: {keep_path}")
        
        for delete_path in delete_paths:
            try:
                os.remove(delete_path)
                print(f"   ✗ DELETED: {delete_path}")
                deleted_count += 1
            except Exception as e:
                print(f"   ✗ FAILED: {delete_path}")
                print(f"      Error: {e}")
                failed_deletions.append((delete_path, str(e)))
    
    # Summary
    print("\n" + "=" * 80)
    print(f"\n📊 DELETION SUMMARY:")
    print(f"   Files successfully deleted: {deleted_count}")
    print(f"   Files failed to delete: {len(failed_deletions)}")
    
    if failed_deletions:
        print(f"\n⚠️  Failed deletions:")
        for path, error in failed_deletions:
            print(f"   - {path}")
            print(f"     Error: {error}")
    
    print(f"\n✅ Cleanup complete!")

if __name__ == "__main__":
    main()
