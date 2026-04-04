#!/usr/bin/env python3
"""
VIVIM.docs Directory Inventory Builder

Scans the VIVIM.docs directory and creates a comprehensive inventory
of all markdown files for reorganization planning.

Usage:
    python build-vivim-inventory.py [--directory PATH]
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime
from collections import Counter
from typing import Dict, List, Optional, Tuple


def extract_frontmatter(content: str) -> Dict:
    """Extract YAML frontmatter if present."""
    frontmatter = {}
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            fm_content = parts[1].strip()
            for line in fm_content.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    frontmatter[key.strip()] = value.strip()
    return frontmatter


def extract_headings(content: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract first H1 and H2 headings."""
    h1 = None
    h2 = None
    
    for line in content.split('\n'):
        line = line.strip()
        if line.startswith('# ') and not h1:
            h1 = line[2:].strip()
        elif line.startswith('## ') and not h2:
            h2 = line[3:].strip()
        if h1 and h2:
            break
    
    return h1, h2


def extract_first_sentences(content: str, frontmatter: Dict) -> str:
    """Extract first 2-3 sentences of actual content."""
    # Remove frontmatter
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            content = parts[2]
    
    # Remove code blocks
    content = re.sub(r'```[\s\S]*?```', '', content)
    
    # Remove headings
    content = re.sub(r'^#+\s*.*$', '', content, flags=re.MULTILINE)
    
    # Extract sentences
    sentences = re.split(r'[.!?]+', content)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
    
    return ' '.join(sentences[:3])[:200]


def count_words(content: str) -> int:
    """Count words in content."""
    # Remove frontmatter
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            content = parts[2]
    
    # Remove code blocks
    content = re.sub(r'```[\s\S]*?```', '', content)
    
    return len(content.split())


def find_duplicates(files: List[Dict]) -> List[Dict]:
    """Find files with similar names."""
    name_groups = {}
    
    for f in files:
        name = Path(f['file_name']).stem.lower()
        # Normalize name
        name = re.sub(r'[\s_-]+', '_', name)
        name = re.sub(r'\d+', 'N', name)  # Replace numbers
        
        if name not in name_groups:
            name_groups[name] = []
        name_groups[name].append(f['file_path'])
    
    duplicates = []
    for name, paths in name_groups.items():
        if len(paths) > 1:
            duplicates.append({
                'pattern': name,
                'files': paths
            })
    
    return duplicates


def scan_directory(root_path: Path) -> List[Dict]:
    """Scan directory for markdown files."""
    files = []
    
    for md_file in root_path.rglob('*.md'):
        try:
            rel_path = md_file.relative_to(root_path)
            stat = md_file.stat()
            
            with open(md_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            frontmatter = extract_frontmatter(content)
            h1, h2 = extract_headings(content)
            first_sentences = extract_first_sentences(content, frontmatter)
            word_count = count_words(content)
            
            files.append({
                'file_path': str(rel_path),
                'file_name': md_file.name,
                'directory': str(rel_path.parent),
                'word_count': word_count,
                'first_heading': h1,
                'second_heading': h2,
                'first_sentences': first_sentences,
                'tags': frontmatter.get('tags', ''),
                'categories': frontmatter.get('categories', ''),
                'modified_date': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'created_date': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'is_stub': word_count < 100,
            })
        except Exception as e:
            print(f"Error processing {md_file}: {e}")
    
    return files


def generate_summary(files: List[Dict]) -> Dict:
    """Generate summary statistics."""
    total_words = sum(f['word_count'] for f in files)
    
    # Count words in filenames
    filename_words = []
    stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'}
    
    for f in files:
        name = Path(f['file_name']).stem.lower()
        words = re.findall(r'[a-z]+', name)
        filename_words.extend([w for w in words if w not in stopwords and len(w) > 2])
    
    word_counts = Counter(filename_words)
    top_words = word_counts.most_common(10)
    
    # Find stubs
    stubs = [f for f in files if f['is_stub']]
    
    # Find duplicates
    duplicates = find_duplicates(files)
    
    # Count by directory
    dir_counts = Counter(f['directory'] for f in files)
    
    return {
        'total_files': len(files),
        'total_word_count': total_words,
        'average_words_per_file': total_words // len(files) if files else 0,
        'top_10_filename_words': top_words,
        'near_duplicate_files': duplicates,
        'stub_files': [f['file_path'] for f in stubs],
        'files_by_directory': dict(dir_counts.most_common()),
        'generated_at': datetime.now().isoformat()
    }


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Build VIVIM.docs inventory')
    parser.add_argument('--directory', '-d', default='VIVIM.docs',
                        help='Directory to scan (default: VIVIM.docs)')
    parser.add_argument('--output', '-o', default='VIVIM.docs/_inventory.json',
                        help='Output file path')
    
    args = parser.parse_args()
    
    root_path = Path(args.directory)
    
    if not root_path.exists():
        print(f"Error: Directory not found: {root_path}")
        return 1
    
    print(f"Scanning {root_path} for markdown files...")
    files = scan_directory(root_path)
    
    if not files:
        print("No markdown files found.")
        return 0
    
    print(f"Found {len(files)} files")
    
    # Generate summary
    summary = generate_summary(files)
    
    # Create inventory
    inventory = {
        'summary': summary,
        'files': files
    }
    
    # Save JSON
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2, ensure_ascii=False)
    
    print(f"\nInventory saved to: {output_path}")
    
    # Print summary to console
    print("\n" + "=" * 70)
    print("VIVIM.docs INVENTORY SUMMARY")
    print("=" * 70)
    print(f"Total files:        {summary['total_files']}")
    print(f"Total word count:   {summary['total_word_count']:,}")
    print(f"Average words/file: {summary['average_words_per_file']:,}")
    
    print("\nTop 10 words in filenames:")
    for word, count in summary['top_10_filename_words']:
        print(f"  - {word}: {count}")
    
    print(f"\nStub files (<100 words): {len(summary['stub_files'])}")
    if summary['stub_files'][:5]:
        print("  Examples:")
        for stub in summary['stub_files'][:5]:
            print(f"    - {stub}")
    
    print(f"\nNear-duplicate file groups: {len(summary['near_duplicate_files'])}")
    if summary['near_duplicate_files'][:3]:
        print("  Examples:")
        for dup in summary['near_duplicate_files'][:3]:
            print(f"    Pattern '{dup['pattern']}': {len(dup['files'])} files")
    
    print("\nFiles by directory:")
    for dir_path, count in list(summary['files_by_directory'].items())[:10]:
        print(f"  {dir_path}: {count}")
    
    print("=" * 70)
    
    return 0


if __name__ == "__main__":
    exit(main())
