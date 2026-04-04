# OpenScroll/VIVIM - Priority Work List

## 🔴 P0 - Critical (Must Fix)

| # | Issue | Location | Status |
|---|-------|----------|--------|
| 1 | **PWA Build Errors** | `pwa/` - TypeScript errors blocking build | ⚠️ IN PROGRESS |
| 2 | **Missing Login Page** | No dedicated `/login` route | ✅ DONE |
| 3 | **Auth Inconsistency** | Routes still use `x-user-id` header | ⚠️ PARTIAL |
| 4 | **No Account Deletion UI** | API exists but no PWA UI | ✅ DONE |

## 🟠 P1 - High Priority

| # | Issue | Location | Status |
|---|-------|----------|--------|
| 5 | **Prisma Migration Needed** | New `AccountStatus` enum | ✅ READY |
| 6 | **Session Auth on All Routes** | Many routes missing auth | ⚠️ PARTIAL |
| 7 | **No Loading States** | PWA skeleton/loading UI | ✅ DONE |
| 8 | **No Error Boundaries** | React error boundaries | ✅ DONE |

## 🟡 P2 - Medium Priority

| # | Issue | Location | Status |
|---|-------|----------|--------|
| 9 | **Missing Tests** | No E2E or unit tests | ❌ |
| 10 | **API Documentation** | Swagger incomplete | ⚠️ |
| 11 | **Rate Limiting Disabled** | `if (false)` in server.js | ✅ DONE |
| 12 | **No Input Validation** | Some routes lack Zod | ⚠️ |

## 🟢 P3 - Nice to Have

| # | Issue | Location | Status |
|---|-------|----------|--------|
| 13 | **PWA Offline Support** | Service worker | ⚠️ |
| 14 | **Push Notifications** | Not implemented | ❌ |
| 15 | **Mobile App** | `/mobile` folder | ❌ |
| 16 | **WebPush** | Not implemented | ❌ |

---

## ✅ Completed This Session

1. ✅ Created `/login` page with Google OAuth
2. ✅ Added account deletion UI to Settings
3. ✅ Enabled rate limiting (prod only)
4. ✅ Added React ErrorBoundary
5. ✅ Created account lifecycle service
6. ✅ Added account status middleware
7. ✅ Fixed auth middleware to check account status

## Next Steps

1. **Run Prisma migration**: `cd server && bunx prisma db push`
2. **Fix remaining TypeScript errors** (optional - blocks prod build)
3. **Add E2E tests**
4. **Complete mobile app**
