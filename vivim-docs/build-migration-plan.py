#!/usr/bin/env python3
"""
Migration Plan Builder
Classifies all 489 markdown files into the new taxonomy structure.
"""

import json
import re
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(r"C:\0-BlackBoxProject-0\vivim-docs")

# Target taxonomy
TAXONOMY = {
    "01-PLATFORM/architecture/": [],
    "01-PLATFORM/context-engine/": [],
    "01-PLATFORM/acu-system/": [],
    "01-PLATFORM/database/": [],
    "02-PRODUCT/features/": [],
    "02-PRODUCT/ux-design/": [],
    "02-PRODUCT/roadmap/": [],
    "02-PRODUCT/demos/": [],
    "03-FRONTEND/pwa/": [],
    "03-FRONTEND/design-system/": [],
    "03-FRONTEND/components/": [],
    "04-NETWORK-SDK/p2p-network/": [],
    "04-NETWORK-SDK/blockchain/": [],
    "04-NETWORK-SDK/sdk/": [],
    "05-SECURITY/zero-trust/": [],
    "05-SECURITY/chain-of-trust/": [],
    "05-SECURITY/privacy/": [],
    "06-RESEARCH/sovereign-memory/": [],
    "06-RESEARCH/detection-algorithms/": [],
    "06-RESEARCH/mathematics/": [],
    "07-BUSINESS/pitch-investor/": [],
    "07-BUSINESS/strategy/": [],
    "07-BUSINESS/operations/": [],
    "07-BUSINESS/open-source/": [],
    "07-BUSINESS/website/": [],
    "08-ARCHIVE/": [],
    "_working/": [],
}

# Keywords for classification
KEYWORDS = {
    "01-PLATFORM/architecture/": ["architecture", "system", "overview", "blueprint", "infrastructure", "platform"],
    "01-PLATFORM/context-engine/": ["context", "engine", "dynamic context", "contextualization"],
    "01-PLATFORM/acu-system/": ["acu", "atomic chat", "chat unit", "memory unit"],
    "01-PLATFORM/database/": ["database", "schema", "prisma", "sql", "data model", "tables"],
    "02-PRODUCT/features/": ["feature", "features", "capability", "functionality", "user story"],
    "02-PRODUCT/ux-design/": ["ux", "user flow", "experience", "journey", "wireframe", "interaction"],
    "02-PRODUCT/roadmap/": ["roadmap", "timeline", "milestone", "phase", "prioritization", "quarter"],
    "02-PRODUCT/demos/": ["demo", "walkthrough", "showcase", "presentation"],
    "03-FRONTEND/pwa/": ["pwa", "progressive web app", "offline", "service worker", "manifest"],
    "03-FRONTEND/design-system/": ["design system", "tokens", "typography", "color", "visual", "style guide"],
    "03-FRONTEND/components/": ["component", "ui", "react", "frontend", "view", "page"],
    "04-NETWORK-SDK/p2p-network/": ["p2p", "peer-to-peer", "federation", "network", "crdt", "distributed"],
    "04-NETWORK-SDK/blockchain/": ["blockchain", "crypto", "wallet", "web3", "decentralized"],
    "04-NETWORK-SDK/sdk/": ["sdk", "api", "integration", "developer", "library", "npm"],
    "05-SECURITY/zero-trust/": ["zero trust", "permission", "access control", "rbac", "authorization"],
    "05-SECURITY/chain-of-trust/": ["chain of trust", "verification", "audit", "integrity", "provenance"],
    "05-SECURITY/privacy/": ["privacy", "gdpr", "data protection", "encryption", "sovereign"],
    "06-RESEARCH/sovereign-memory/": ["sovereign memory", "memory infrastructure", "ai memory", "third party access"],
    "06-RESEARCH/detection-algorithms/": ["detection", "algorithm", "classify", "categorization", "ai data detection"],
    "06-RESEARCH/mathematics/": ["math", "mathematics", "new maths", "formula", "theorem"],
    "07-BUSINESS/pitch-investor/": ["pitch", "investor", "fundraising", "valuation", "market", "problem", "solution"],
    "07-BUSINESS/strategy/": ["strategy", "business model", "competitive", "moat", "positioning"],
    "07-BUSINESS/operations/": ["operations", "cost", "budget", "legal", "fractal ownership", "biz"],
    "07-BUSINESS/open-source/": ["open source", "open-core", "opencore", "license", "community"],
    "07-BUSINESS/website/": ["website", "web section", "landing", "hero", "marketing page"],
}

# Archive indicators
ARCHIVE_PATHS = [".archive", ".old", ".current", "legacy", "vivim-app-legacy"]

def is_archive_path(path):
    """Check if file is in an archive location."""
    path_lower = path.lower()
    return any(indicator in path_lower for indicator in ARCHIVE_PATHS)

def classify_by_content(file_info):
    """Classify a file based on its content metadata."""
    path = file_info.get('path', '').lower()
    name = file_info.get('name', '').lower()
    heading = (file_info.get('first_heading') or '').lower()
    sentences = (file_info.get('first_sentences') or '').lower()
    tags = file_info.get('tags', [])
    
    content_text = f"{heading} {sentences} {' '.join(tags)}"
    
    # Check for OpenCore files first (they're well-organized)
    if path.startswith("opencore"):
        if "philosophy" in name or "strategy" in name:
            return "07-BUSINESS/open-source/", "high"
        elif "blueprint" in name or "index" in name:
            return "07-BUSINESS/open-source/", "high"
        elif "architecture" in name:
            return "01-PLATFORM/architecture/", "high"
        elif "component" in name:
            return "03-FRONTEND/components/", "high"
        elif "database" in name or "schema" in name:
            return "01-PLATFORM/database/", "high"
        elif "roadmap" in name:
            return "02-PRODUCT/roadmap/", "high"
        elif "website" in name or "web" in name:
            return "07-BUSINESS/website/", "high"
        elif "algorithm" in name:
            return "07-BUSINESS/open-source/", "high"
        elif "gap" in name:
            return "08-ARCHIVE/", "medium"
        else:
            return "07-BUSINESS/open-source/", "medium"
    
    # Check for chain-of-trust (research files)
    if path.startswith("chain-of-trust"):
        if "detection" in content_text or "algo" in name:
            return "06-RESEARCH/detection-algorithms/", "high"
        elif "memory" in content_text and "3rd party" in content_text:
            return "06-RESEARCH/sovereign-memory/", "high"
        elif "privacy toolkit" in content_text:
            return "05-SECURITY/privacy/", "high"
        elif "math" in content_text:
            return "06-RESEARCH/mathematics/", "high"
        elif "vault" in content_text or "nature" in content_text:
            return "05-SECURITY/chain-of-trust/", "high"
        elif "tools and methods" in content_text:
            return "05-SECURITY/chain-of-trust/", "medium"
        elif "vivim" in content_text and len(content_text) < 200:
            return "08-ARCHIVE/", "low"  # Likely raw chat dump
        else:
            return "05-SECURITY/chain-of-trust/", "medium"
    
    # Check for knowledge folder (numbered docs)
    if path.startswith("knowledge"):
        if "architecture" in path or "01-" in name:
            return "01-PLATFORM/architecture/", "high"
        elif "features" in path or "02-" in name:
            return "02-PRODUCT/features/", "high"
        elif "context" in path or "03-" in name:
            return "01-PLATFORM/context-engine/", "high"
        elif "acu" in path or "04-" in name:
            return "01-PLATFORM/acu-system/", "high"
        elif "demos" in path or "05-" in name:
            return "02-PRODUCT/demos/", "high"
        elif "integration" in path or "06-" in name:
            return "04-NETWORK-SDK/sdk/", "high"
        elif "security" in path or "07-" in name:
            return "05-SECURITY/zero-trust/", "high"
        elif "messaging" in path or "08-" in name:
            return "04-NETWORK-SDK/sdk/", "high"
        elif "data" in path or "09-" in name or "10-" in name:
            return "01-PLATFORM/database/", "high"
        elif "component" in path or "11-" in name:
            return "03-FRONTEND/components/", "high"
        elif "cinematic" in path or "unreleased" in path or "consolidated" in path or "12-" in name or "13-" in name or "14-" in name:
            return "08-ARCHIVE/", "medium"
        else:
            return "01-PLATFORM/architecture/", "medium"
    
    # Check for VIVIM.docs subfolders
    if path.startswith("vivim.docs"):
        # Check for archive paths first
        if is_archive_path(path):
            return "08-ARCHIVE/", "high"
        
        if "pitch" in path or "investor" in path:
            return "07-BUSINESS/pitch-investor/", "high"
        elif "biz" in path or "fractal" in path:
            return "07-BUSINESS/operations/", "high"
        elif "design" in path:
            if "system" in content_text or "token" in content_text:
                return "03-FRONTEND/design-system/", "high"
            else:
                return "03-FRONTEND/ux-design/", "high"
        elif "database" in path:
            return "01-PLATFORM/database/", "high"
        elif "network" in path:
            if "blockchain" in content_text:
                return "04-NETWORK-SDK/blockchain/", "high"
            elif "p2p" in content_text or "federation" in content_text or "crdt" in content_text:
                return "04-NETWORK-SDK/p2p-network/", "high"
            else:
                return "04-NETWORK-SDK/p2p-network/", "medium"
        elif "sovereign-memory" in path:
            return "06-RESEARCH/sovereign-memory/", "high"
        elif "ai-chats" in path:
            return "08-ARCHIVE/", "high"  # Raw chat dumps
        elif "000---ideas" in path:
            return "_working/", "high"
        elif "vivim.docs.context" in path:
            # This looks like SDK documentation
            if "sdk" in path:
                return "04-NETWORK-SDK/sdk/", "high"
            elif "architecture" in path:
                return "01-PLATFORM/architecture/", "high"
            elif "network" in path:
                return "04-NETWORK-SDK/p2p-network/", "high"
            elif "pwa" in path:
                return "03-FRONTEND/pwa/", "high"
            else:
                return "04-NETWORK-SDK/sdk/", "medium"
        elif "vivim-app-legacy" in path:
            return "08-ARCHIVE/", "high"
    
    # Generic classification by keywords
    for destination, keywords in KEYWORDS.items():
        for keyword in keywords:
            if keyword in content_text or keyword in name:
                return destination, "medium"
    
    # Default to archive if unclear
    return "08-ARCHIVE/", "low"

def check_short_or_no_heading(file_info):
    """Check if file is a stub (under 100 words or no headings)."""
    word_count = file_info.get('word_count', 0)
    has_heading = file_info.get('h1') or file_info.get('h2')
    return word_count < 100 and not has_heading

def main():
    # Load inventory
    with open(ROOT_DIR / "_inventory.json", 'r', encoding='utf-8') as f:
        inventory_data = json.load(f)
    
    inventory = inventory_data['inventory']
    duplicates = inventory_data['summary']['near_duplicate_files']
    short_files = inventory_data['summary']['short_files_under_100_words']
    
    migrations = []
    stats = {
        "total_files": len(inventory),
        "files_by_destination": {},
        "promote_candidates": [],
        "duplicate_decisions": [],
        "files_needing_human_review": []
    }
    
    # Build duplicate lookup
    duplicate_lookup = {}
    for dup in duplicates:
        for filepath in dup['files']:
            duplicate_lookup[filepath] = dup
    
    processed = set()
    
    for file_info in inventory:
        path = file_info['path']
        if path in processed:
            continue
        processed.add(path)
        
        # Default classification
        destination, confidence = classify_by_content(file_info)
        action = "move"
        reason = f"Classified based on content matching {destination}"
        
        # Check for archive paths - keep in archive unless high-value
        if is_archive_path(path):
            # Check if it might be worth promoting
            heading = file_info.get('first_heading', '')
            if confidence == 'high' and file_info.get('word_count', 0) > 500:
                action = "promote"
                reason = "Archive file with high-value content worth promoting"
                stats["promote_candidates"].append({
                    "source": path,
                    "suggested_destination": destination,
                    "word_count": file_info.get('word_count', 0),
                    "heading": heading
                })
            else:
                destination = "08-ARCHIVE/"
                action = "archive"
                reason = "File in archive folder"
        
        # Check for stubs
        if check_short_or_no_heading(file_info) and destination != "08-ARCHIVE/":
            if "chain-of-trust" not in path:  # Keep research files even if short
                destination = "_working/"
                action = "move"
                reason = "Stub file under 100 words without headings"
        
        # Handle duplicates
        if path in duplicate_lookup:
            dup_info = duplicate_lookup[path]
            other_file = dup_info['files'][0] if dup_info['files'][1] == path else dup_info['files'][1]
            
            # Compare modification dates
            other_info = next((f for f in inventory if f['path'] == other_file), None)
            if other_info:
                current_mod = file_info.get('last_modified', '')
                other_mod = other_info.get('last_modified', '')
                
                if current_mod >= other_mod:
                    # Keep this one, archive the other
                    stats["duplicate_decisions"].append({
                        "keep": path,
                        "archive": other_file,
                        "reason": f"More recent modification ({current_mod} vs {other_mod})"
                    })
                    reason = f"Duplicate pair - keeping newer version"
                else:
                    destination = "08-ARCHIVE/duplicates/"
                    action = "archive"
                    reason = f"Duplicate pair - older version (newer: {other_file})"
                    confidence = "high"
        
        # Flag low confidence for review
        if confidence == "low":
            action = "review"
            stats["files_needing_human_review"].append({
                "source": path,
                "suggested_destination": destination,
                "reason": "Low confidence classification",
                "heading": file_info.get('first_heading'),
                "word_count": file_info.get('word_count', 0)
            })
        
        # Check for raw AI chat dumps
        heading = file_info.get('first_heading', '') or ''
        if any(indicator in heading.lower() for indicator in ['chatgpt', 'opus 4', 'minimax', 'gemini', 'claude']):
            if "chain-of-trust" not in path and "research" not in destination:
                if "tools and methods" not in heading.lower():
                    action = "review"
                    stats["files_needing_human_review"].append({
                        "source": path,
                        "suggested_destination": destination,
                        "reason": "Appears to be raw AI chat dump",
                        "heading": heading,
                        "word_count": file_info.get('word_count', 0)
                    })
        
        migration = {
            "source": path,
            "destination": destination + file_info['name'] if destination != "08-ARCHIVE/" else destination + path.replace('\\', '/').split('/')[-1],
            "reason": reason,
            "confidence": confidence,
            "action": action
        }
        migrations.append(migration)
        
        # Update stats
        dest_base = destination.rstrip('/')
        if dest_base not in stats["files_by_destination"]:
            stats["files_by_destination"][dest_base] = 0
        stats["files_by_destination"][dest_base] += 1
    
    # Sort migrations by destination
    migrations.sort(key=lambda x: x['destination'])
    
    # Build output
    output = {
        "generated_at": datetime.now().isoformat(),
        "stats": stats,
        "migrations": migrations
    }
    
    # Write migration plan
    output_path = ROOT_DIR / "_migration_plan.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("=" * 70)
    print("MIGRATION PLAN SUMMARY")
    print("=" * 70)
    print(f"Total files: {stats['total_files']}")
    print(f"\nFiles by destination:")
    for dest, count in sorted(stats['files_by_destination'].items(), key=lambda x: -x[1]):
        print(f"  {dest}: {count}")
    
    print(f"\nPromote candidates: {len(stats['promote_candidates'])}")
    for p in stats['promote_candidates'][:5]:
        print(f"  - {p['source']} ({p['word_count']} words)")
    if len(stats['promote_candidates']) > 5:
        print(f"  ... and {len(stats['promote_candidates']) - 5} more")
    
    print(f"\nDuplicate decisions: {len(stats['duplicate_decisions'])}")
    for d in stats['duplicate_decisions'][:5]:
        print(f"  - Keep: {d['keep']} | Archive: {d['archive']}")
    if len(stats['duplicate_decisions']) > 5:
        print(f"  ... and {len(stats['duplicate_decisions']) - 5} more")
    
    print(f"\nFiles needing human review: {len(stats['files_needing_human_review'])}")
    for r in stats['files_needing_human_review'][:5]:
        print(f"  - {r['source']}")
        print(f"    Reason: {r['reason']}")
    if len(stats['files_needing_human_review']) > 5:
        print(f"  ... and {len(stats['files_needing_human_review']) - 5} more")
    
    print(f"\n{'=' * 70}")
    print(f"Full migration plan saved to: {output_path}")
    print(f"{'=' * 70}")

if __name__ == '__main__':
    main()
