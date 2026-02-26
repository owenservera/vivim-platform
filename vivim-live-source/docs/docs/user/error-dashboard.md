---
title: Error Dashboard
description: Monitor and troubleshoot errors
---

# Error Dashboard

The Error Dashboard shows you any errors or issues that occur in VIVIM. It's useful for troubleshooting problems and understanding what's happening under the hood.

---

## Accessing Error Dashboard

Navigate to **Errors** at `/errors`

---

## What It Shows

### Error Statistics
Overview of errors:
- **Total errors** - Count of all errors
- **By Level** - Error, Warning, Info, Debug
- **By Component** - PWA, Network, Server, Shared
- **By Severity** - Low, Medium, High, Critical
- **By Category** - Sync, Network, Database, etc.
- **Recent** - Errors in last 24 hours

---

## Recent Errors List

Each error shows:
- **Timestamp** - When it occurred
- **Level** - Error/Warning/Info/Debug
- **Component** - Where it happened
- **Category** - Type of error
- **Message** - What went wrong
- **Severity** - How serious

### Filtering
Filter errors by:
- Component (PWA, Network, Server)
- Severity (Low, Medium, High, Critical)
- Category
- Time range (1h, 6h, 24h, 7d)

---

## Understanding Errors

### Common Error Types

| Category | Description | Usually Caused By |
|----------|-------------|-------------------|
| NETWORK_TIMEOUT | Request took too long | Slow connection |
| CONNECTION_LOST | Internet disconnected | Offline mode |
| SYNC_CONFLICT | Data sync issue | Offline edits |
| DATABASE_ERROR | Database operation failed | Storage issues |
| AUTH_EXPIRED | Session expired | Need to re-login |
| VALIDATION_FAILED | Invalid input | User input |

### Severity Levels

- **Low** - Minor issues, doesn't affect usage
- **Medium** - Noticeable but not blocking
- **High** - Significantly impacts functionality
- **Critical** - App may crash or data loss

---

## For Developers

If you're a developer, error details include:
- Stack traces
- Request/response data
- User context
- Session information

---

## Troubleshooting Tips

### If You See Errors

1. **Refresh** - Pull down to refresh the list
2. **Note patterns** - Do errors happen at same time/place?
3. **Check connection** - Many errors are network-related
4. **Try again later** - Some errors are temporary

### Persistent Errors

If errors persist:
1. Note the error message and time
2. Try clearing local data
3. Check VIVIM status page
4. Contact support with error details

---

## Privacy

Error reports:
- Stored locally on your device
- May include technical details
- Not shared with third parties

---

## For Most Users

The Error Dashboard is mainly useful when:
- Troubleshooting specific issues
- Reporting bugs to VIVIM
- Understanding why something isn't working

Most users won't need to visit regularly.
