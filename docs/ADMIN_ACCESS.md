# Admin Access Guide

This guide explains how ListForge employee/admin access works, how to grant admin privileges, and available admin capabilities.

## Overview

ListForge uses a **global role system** where users can have one of three roles:

- **`user`** (default) - Regular customer with access to their organizations
- **`staff`** - ListForge employee with read-only admin access
- **`superadmin`** - ListForge super admin with full system access

Admin endpoints are protected by the `AdminGuard` which requires `staff` or `superadmin` role.

## Granting Admin Access

There is currently **no UI** for creating admin users. You must update the database directly.

### Method 1: Update Existing User (Recommended)

1. **Create a normal account** via the web UI at `/signup`

2. **Connect to the database:**
   ```bash
   # Using Docker Compose
   docker exec -it listforge-postgres psql -U listforge -d listforge_dev

   # Or using psql directly
   psql postgresql://listforge:listforge@localhost:5432/listforge_dev
   ```

3. **Grant admin role:**
   ```sql
   -- Make a user staff (read-only admin)
   UPDATE users
   SET "globalRole" = 'staff'
   WHERE email = 'admin@listforge.com';

   -- Make a user superadmin (full admin)
   UPDATE users
   SET "globalRole" = 'superadmin'
   WHERE email = 'admin@listforge.com';
   ```

4. **Verify the change:**
   ```sql
   SELECT id, email, name, "globalRole" FROM users
   WHERE "globalRole" IN ('staff', 'superadmin');
   ```

5. **Log out and log back in** - The JWT token needs to be refreshed to include the new role

### Method 2: Create Admin via Migration (Production)

For production deployments, create a migration that sets up admin users:

```sql
-- Create a migration file
-- apps/listforge-api/src/migrations/YYYYMMDDHHMMSS-CreateAdminUser.ts

import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';

export class CreateAdminUser1234567890000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const passwordHash = await bcrypt.hash('CHANGE_ME_SECURE_PASSWORD', 10);

        await queryRunner.query(
            `INSERT INTO users (email, name, "passwordHash", "globalRole", "createdAt")
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (email) DO NOTHING`,
            ['admin@listforge.com', 'ListForge Admin', passwordHash, 'superadmin']
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM users WHERE email = $1`,
            ['admin@listforge.com']
        );
    }
}
```

**Security Note:** Store production admin credentials in a secure vault, not in code.

## Admin API Endpoints

All admin endpoints require authentication with a `staff` or `superadmin` role.

**Base URL:** `/admin`

**Authentication:** JWT token with admin role in the `Authorization: Bearer <token>` header

### User Management

**List all users:**
```bash
GET /admin/users
```

**Get user details:**
```bash
GET /admin/users/:id
```

Returns user info, organization memberships, and roles.

**Update user role:**
```bash
PATCH /admin/users/:id
Content-Type: application/json

{
  "globalRole": "staff"  // or "superadmin" or "user"
}
```

**Disable user:**
```bash
POST /admin/users/:id/disable
```

Prevents user from logging in (sets `disabled: true`).

**Enable user:**
```bash
POST /admin/users/:id/enable
```

### Organization Management

**List all organizations:**
```bash
GET /admin/orgs
```

Returns all orgs with member counts.

**Get organization details:**
```bash
GET /admin/orgs/:id
```

Returns org info, members, item counts, and marketplace accounts.

**Update organization status:**
```bash
PATCH /admin/orgs/:id/status
Content-Type: application/json

{
  "status": "active"  // or "suspended" or "deleted"
}
```

Organization statuses:
- `active` - Normal operation
- `suspended` - Temporarily disabled (users can't access)
- `deleted` - Soft deleted (hidden from UI)

### Marketplace Account Management

**List marketplace accounts:**
```bash
GET /admin/marketplace-accounts?marketplace=EBAY&status=active&orgId=xxx
```

Query parameters:
- `marketplace` - Filter by marketplace (EBAY, AMAZON, etc.)
- `status` - Filter by status (active, revoked, expired)
- `orgId` - Filter by organization ID

**Disable marketplace account:**
```bash
POST /admin/marketplace-accounts/:id/disable
```

Sets status to `revoked` and prevents use.

### Audit Logs

**Get marketplace audit logs:**
```bash
GET /admin/marketplace-audit-logs?orgId=xxx&eventType=oauth_connected&limit=50
```

Query parameters:
- `orgId` - Filter by organization
- `accountId` - Filter by marketplace account
- `userId` - Filter by user
- `eventType` - Filter by event type
- `limit` - Max results (default: 100)
- `offset` - Skip results (pagination)

Event types:
- `oauth_connected` - Marketplace account connected
- `oauth_disconnected` - Marketplace account disconnected
- `token_refreshed` - OAuth token refreshed
- `token_refresh_failed` - Token refresh failed
- `account_revoked` - Account manually disabled

### System Metrics

**Get system health:**
```bash
GET /admin/system/metrics
```

Returns:
- **Queue stats** - Waiting, active, and failed job counts for:
  - AI workflow queue
  - Marketplace publish queue
  - Marketplace sync queue
- **Entity counts** - Total users, orgs, items, marketplace accounts
- **Recent workflow runs** - Last 10 AI workflow executions with status

Use this to monitor system health and identify bottlenecks.

## Admin Capabilities by Role

| Capability | user | staff | superadmin |
|-----------|------|-------|------------|
| View all users | ❌ | ✅ | ✅ |
| View all organizations | ❌ | ✅ | ✅ |
| View marketplace accounts | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ✅ | ✅ |
| View system metrics | ❌ | ✅ | ✅ |
| Disable users | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅* |
| Suspend organizations | ❌ | ❌ | ✅* |
| Disable marketplace accounts | ❌ | ✅ | ✅ |

*Currently both `staff` and `superadmin` can perform these actions due to the `AdminGuard` allowing both roles. Consider implementing role-specific guards for destructive operations.

## Admin UI

There is currently **no admin UI**. Admin operations must be performed via:

1. **Direct API calls** using curl, Postman, or similar tools
2. **Database queries** for user role management
3. **Backend logs** for monitoring

### Example: Using curl for Admin Operations

1. **Login as admin user:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@listforge.com","password":"your-password"}'
   ```

   Save the `accessToken` from the response.

2. **List all users:**
   ```bash
   curl -X GET http://localhost:3001/api/admin/users \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. **Get system metrics:**
   ```bash
   curl -X GET http://localhost:3001/api/admin/system/metrics \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

4. **Disable a user:**
   ```bash
   curl -X POST http://localhost:3001/api/admin/users/USER_ID/disable \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Security Considerations

### Production Recommendations

1. **Limit superadmin accounts** - Only 1-2 trusted employees
2. **Use staff for most operations** - Read-only access for support team
3. **Audit all admin actions** - Monitor admin API usage
4. **Rotate admin credentials regularly** - Change passwords quarterly
5. **Enable MFA for admin accounts** - (Not yet implemented - future feature)
6. **Log admin actions** - Track who did what and when
7. **Separate admin accounts** - Don't use admin accounts for regular work

### Future Enhancements

Consider implementing:

- [ ] Admin UI dashboard
- [ ] Role-based permissions (separate staff from superadmin capabilities)
- [ ] Admin action audit trail
- [ ] MFA requirement for admin accounts
- [ ] IP whitelist for admin endpoints
- [ ] Rate limiting on admin endpoints
- [ ] Admin invitation flow (vs database updates)
- [ ] Impersonation feature (login as user for support)

## Troubleshooting

### "Admin access required" error

**Cause:** User doesn't have `staff` or `superadmin` role

**Fix:**
1. Check user's role: `SELECT email, "globalRole" FROM users WHERE email = 'you@example.com';`
2. Update if needed: `UPDATE users SET "globalRole" = 'staff' WHERE email = 'you@example.com';`
3. Log out and log back in to refresh JWT token

### Changes not taking effect

**Cause:** JWT token cached with old role

**Fix:** Log out and log back in. The JWT payload includes the `globalRole` and must be regenerated.

### Can't access database

**Cause:** Database credentials wrong or not accessible

**Fix:**
- Check `.env` for correct `DATABASE_URL`
- Ensure PostgreSQL is running: `docker-compose ps`
- Try connection: `psql $DATABASE_URL`

## Best Practices

1. **Create admin accounts via migration** in production (not manual DB updates)
2. **Use staff role for support team** - reserve superadmin for engineering
3. **Monitor admin endpoint usage** - track who's doing what
4. **Document admin actions** - keep a log of user disables, org suspensions, etc.
5. **Test in development first** - never test admin features in production
6. **Use secure passwords** - admin accounts are high-value targets
7. **Revoke access immediately** - when employees leave, disable admin accounts

## Quick Reference

```bash
# Grant staff role
UPDATE users SET "globalRole" = 'staff' WHERE email = 'user@listforge.com';

# Grant superadmin role
UPDATE users SET "globalRole" = 'superadmin' WHERE email = 'user@listforge.com';

# Revoke admin role (back to user)
UPDATE users SET "globalRole" = 'user' WHERE email = 'user@listforge.com';

# List all admin users
SELECT email, "globalRole", "createdAt" FROM users
WHERE "globalRole" IN ('staff', 'superadmin')
ORDER BY "createdAt" DESC;

# Check if user is disabled
SELECT email, disabled FROM users WHERE email = 'user@listforge.com';
```

## Related Documentation

- [Production Deployment](./DEPLOYMENT.md) - For setting up admin accounts in production
- [eBay Setup](./EBAY_SETUP.md) - Marketplace account management
- API Types: `packages/api-types/src/admin.ts` - Admin API request/response types
