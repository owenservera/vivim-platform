#!/usr/bin/env python3
"""
Markdown File Inventory Builder
Scans all .md files and extracts metadata for reorganization planning.
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path
from collections import Counter

ROOT_DIR = Path(r"C:\0-BlackBoxProject-0\vivim-docs")
STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just',
    'should', 'now', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'having', 'would', 'could', 'what', 'which'
}

def get_word_count(content):
    """Count words in content, excluding code blocks."""
    # Remove code blocks
    content = re.sub(r'```[\s\S]*?```', '', content)
    # Remove inline code
    content = re.sub(r'`[^`]+`', '', content)
    # Remove frontmatter
    content = re.sub(r'^---[\s\S]*?---\n', '', content)
    # Count words
    words = re.findall(r'\b\w+\b', content)
    return len(words)

def extract_headings(content):
    """Extract first H1 and H2 headings."""
    # Remove frontmatter first
    content_no_fm = re.sub(r'^---[\s\S]*?---\n', '', content)
    lines = content_no_fm.split('\n')
    
    h1 = None
    h2 = None
    
    for line in lines:
        if line.startswith('# ') and h1 is None:
            h1 = line[2:].strip()
        elif line.startswith('## ') and h2 is None:
            h2 = line[3:].strip()
        if h1 and h2:
            break
    
    return h1, h2

def extract_first_sentences(content):
    """Extract first 2-3 sentences of actual content."""
    # Remove frontmatter
    content_no_fm = re.sub(r'^---[\s\S]*?---\n', '', content)
    # Remove leading headings
    content_no_fm = re.sub(r'^(?:#+ .*\n)+', '', content_no_fm)
    # Remove code blocks
    content_no_fm = re.sub(r'```[\s\S]*?```', '', content_no_fm)
    content_no_fm = re.sub(r'`[^`]+`', '', content_no_fm)
    
    # Find sentences
    sentences = re.split(r'(?<=[.!?])\s+', content_no_fm.strip())
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
    
    return ' '.join(sentences[:3])[:300]

def extract_frontmatter_tags(content):
    """Extract tags/categories from frontmatter."""
    match = re.search(r'^---([\s\S]*?)---', content)
    if not match:
        return []
    
    fm = match.group(1)
    tags = []
    
    # Look for tags field
    tags_match = re.search(r'tags:\s*\[([^\]]*)\]', fm)
    if tags_match:
        tags.extend([t.strip().strip('"\'') for t in tags_match.group(1).split(',')])
    
    # Look for categories field
    cat_match = re.search(r'categories:\s*\[([^\]]*)\]', fm)
    if cat_match:
        tags.extend([c.strip().strip('"\'') for c in cat_match.group(1).split(',')])
    
    # Look for category (singular)
    cat_single = re.search(r'category:\s*(\S+)', fm)
    if cat_single:
        tags.append(cat_single.group(1).strip('"\''))
    
    return tags

def extract_filename_words(filename):
    """Extract meaningful words from filename."""
    # Remove extension
    name = Path(filename).stem
    # Split on common separators
    words = re.split(r'[-_\s]+', name)
    # Filter stopwords and short words
    words = [w.lower() for w in words if w.lower() not in STOPWORDS and len(w) > 2]
    return words

def check_near_duplicates(files):
    """Find potential duplicate or near-duplicate filenames."""
    normalized = {}
    duplicates = []
    
    for f in files:
        # Normalize: lowercase, remove version numbers, remove model names
        name = Path(f).stem.lower()
        normalized_name = re.sub(r'[-_]?(v\d+|v\d+\.\d+|opus.*|chatgpt.*|minimax.*|nonT|T|thinkin|md)$', '', name)
        normalized_name = normalized_name.strip()
        
        if normalized_name in normalized:
            duplicates.append({
                'normalized_name': normalized_name,
                'files': [normalized[normalized_name], f]
            })
        else:
            normalized[normalized_name] = f
    
    return duplicates

def main():
    inventory = []
    all_words = []
    total_words = 0
    short_files = []
    no_heading_files = []
    
    # Find all .md files
    md_files = list(ROOT_DIR.rglob('*.md'))
    
    print(f"Found {len(md_files)} markdown files. Processing...")
    
    for filepath in md_files:
        try:
            rel_path = filepath.relative_to(ROOT_DIR)
            stat = filepath.stat()
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            word_count = get_word_count(content)
            h1, h2 = extract_headings(content)
            first_sentences = extract_first_sentences(content)
            tags = extract_frontmatter_tags(content)
            filename_words = extract_filename_words(filepath.name)
            
            total_words += word_count
            all_words.extend(filename_words)
            
            file_info = {
                'path': str(rel_path),
                'name': filepath.name,
                'word_count': word_count,
                'first_heading': h1 or h2,
                'h1': h1,
                'h2': h2,
                'first_sentences': first_sentences,
                'tags': tags,
                'last_modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'size_bytes': stat.st_size
            }
            
            inventory.append(file_info)
            
            # Flag issues
            if word_count < 100:
                short_files.append(str(rel_path))
            
            if not h1 and not h2:
                no_heading_files.append(str(rel_path))
            
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            inventory.append({
                'path': str(rel_path),
                'name': filepath.name,
                'error': str(e)
            })
    
    # Sort inventory by path
    inventory.sort(key=lambda x: x['path'])
    
    # Find duplicates
    duplicates = check_near_duplicates([f['path'] for f in inventory])
    
    # Word frequency
    word_freq = Counter(all_words).most_common(10)
    
    # Build output
    output = {
        'generated_at': datetime.now().isoformat(),
        'summary': {
            'total_files': len(inventory),
            'total_word_count': total_words,
            'average_words_per_file': round(total_words / len(inventory)) if inventory else 0,
            'top_10_filename_words': word_freq,
            'near_duplicate_files': duplicates,
            'short_files_under_100_words': short_files,
            'files_without_headings': no_heading_files
        },
        'inventory': inventory
    }
    
    # Write JSON
    output_path = ROOT_DIR / '_inventory.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print("INVENTORY SUMMARY")
    print(f"{'='*60}")
    print(f"Total files: {len(inventory)}")
    print(f"Total word count: {total_words:,}")
    print(f"Average words per file: {round(total_words / len(inventory)) if inventory else 0}")
    
    print(f"\nTop 10 most common words in filenames:")
    for word, count in word_freq:
        print(f"  - {word}: {count}")
    
    print(f"\nNear-duplicate files found: {len(duplicates)}")
    for dup in duplicates[:10]:
        print(f"  - '{dup['normalized_name']}': {dup['files']}")
    if len(duplicates) > 10:
        print(f"  ... and {len(duplicates) - 10} more")
    
    print(f"\nFiles under 100 words (potentially incomplete): {len(short_files)}")
    for f in short_files[:10]:
        print(f"  - {f}")
    if len(short_files) > 10:
        print(f"  ... and {len(short_files) - 10} more")
    
    print(f"\nFiles without any headings: {len(no_heading_files)}")
    for f in no_heading_files[:10]:
        print(f"  - {f}")
    if len(no_heading_files) > 10:
        print(f"  ... and {len(no_heading_files) - 10} more")
    
    print(f"\n{'='*60}")
    print(f"Full inventory saved to: {output_path}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
