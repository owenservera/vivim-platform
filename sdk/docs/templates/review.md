# Code Review Template

**Purpose:** Standardize code reviews

---

## Review: {PR/Change Title}

### Summary

**Description:** {Brief description of changes}

**Author:** {Author name}

**PR Link:** {Link}

**Branches:**
- Source: `feature/branch-name`
- Target: `main`

---

## Changes

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `src/path/file1.ts` | +100 / -20 | {Description} |
| `src/path/file2.ts` | +50 / -5 | {Description} |

### Code Diff

```typescript
// Additions
+ const newCode = 'added';

// Removals
- const oldCode = 'removed';
```

---

## Review Checklist

### Correctness ☐
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] No obvious bugs

### Security ☐
- [ ] No sensitive data exposure
- [ ] Input validation present
- [ ] Authentication/Authorization correct
- [ ] No injection vulnerabilities
- [ ] Secrets not committed

### Performance ☐
- [ ] No obvious performance issues
- [ ] Proper indexing (if DB)
- [ ] Efficient algorithms used
- [ ] No memory leaks

### Code Quality ☐
- [ ] Follows style guide
- [ ] Proper documentation
- [ ] Types are correct
- [ ] No code duplication
- [ ] Naming is clear

### Testing ☐
- [ ] Tests included
- [ ] Test coverage adequate
- [ ] Edge cases tested
- [ ] Integration tests present

### API Design ☐
- [ ] API is intuitive
- [ ] Consistent with codebase
- [ ] Proper error messages
- [ ] Events documented

---

## Findings

### Must Fix (Blocking)

| Issue | Location | Description | Severity |
|-------|----------|-------------|----------|
| #1 | `file.ts:42` | {Issue} | High |
| #2 | `file.ts:100` | {Issue} | High |

### Should Fix (Non-Blocking)

| Issue | Location | Description | Severity |
|-------|----------|-------------|----------|
| #3 | `file.ts:50` | {Issue} | Medium |

### Suggestions (Optional)

| Idea | Location | Description |
|------|----------|-------------|
| #1 | `file.ts:30` | {Suggestion} |

---

## Questions

1. **{Question}:** {Question text}
   - Answer: {Answer}

---

## Verdict

- [ ] **Approve** - Ready to merge
- [ ] **Approve with Comments** - Minor issues, can merge
- [ ] **Request Changes** - Blocking issues
- [ ] **Reject** - Major problems

---

## Comments

### General Comments
{Overall impressions}

### Specific Comments
- Comment 1
- Comment 2

---

## Reviewer Details

| Role | Name | Date | Verdict |
|------|------|------|---------|
| Reviewer | | | |
| Second Reviewer | | | |

---

*Reviewer: {Name}*
*Date: {YYYY-MM-DD}*
*Version: 1.0.0*
