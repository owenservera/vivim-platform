# VIVIM — Postponed / Skipped Tasks

**Generated**: 2026-03-05  
**Reason**: Lower priority or requires external dependencies

---

## Skipped from HIGH TIER Implementation

### VIVIM-GAP-038: Email Notification Service
**Status**: ⏸️ POSTPONED  
**Original Priority**: HIGH — User Engagement  
**Reason for Postponement**: Requires external provider setup (Postmark/SendGrid/AWS SES) and API credentials. Can be implemented when ready to enable user notifications.

**Original Implementation Plan**:
1. Choose email provider (SendGrid, Postmark, or AWS SES)
2. Install provider SDK
3. Create email service with templates for:
   - Share notifications
   - Security alerts
   - System notifications
4. Add email preferences to user settings
5. Create background job for email queue

**Effort**: M (8-10 hours)

**When to Implement**:
- Before public launch
- When share functionality goes live
- When security alerts are required

**Dependencies**:
- Email provider account
- DNS configuration for SPF/DKIM
- `POSTMARK_SERVER_TOKEN` or equivalent env var

**Files That Would Be Modified**:
- `server/src/services/email-service.js` (create)
- `server/package.json` (add email provider SDK)
- `server/.env` (add email provider credentials)
- `server/prisma/schema.prisma` (add EmailPreference model)
- `pwa/src/pages/Settings.tsx` (add email preferences UI)

**Recommended Provider**: Postmark
- Best deliverability rates
- Simple API
- Free tier: 100 emails/month
- Paid: $15/month for 10,000 emails

**Alternative**: Use serverless email API (Resend, EmailJS) to avoid managing infrastructure.

---

## Other Future Considerations

### VIVIM-GAP-039: Post-Quantum Crypto WASM Integration
**Status**: ⏸️ DEFERRED (Low Priority)  
**Reason**: Future-proofing feature. Current classical crypto (Ed25519, AES-GCM) is sufficient for current threat model.

**When to Implement**:
- When quantum computing becomes practical threat
- When compliance requires PQ crypto
- When WASM modules are more mature

---

## Summary

| Task | Status | Reason |
|------|--------|--------|
| GAP-038 | ⏸️ POSTPONED | Requires external provider setup |
| GAP-039 | ⏸️ DEFERRED | Low priority, future-proofing |

**Total Postponed**: 2 tasks  
**Remaining HIGH TIER to Complete**: 5 tasks (GAP-033, 034, 035, 036, 037)

---

**Next Action**: Complete remaining HIGH TIER tasks (033-037)
