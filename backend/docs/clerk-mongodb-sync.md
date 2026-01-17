# Clerk-MongoDB User Synchronization

## Overview

This system ensures users authenticated via Clerk JWT tokens are automatically synced to MongoDB, even if the webhook failed or the Rails server was down during user creation.

## Problem Statement

When users sign up through Clerk:

1. Clerk creates the user account and issues a valid JWT
2. Clerk sends a webhook to Rails to create the user in MongoDB
3. **If Rails is down**, the webhook fails → user exists in Clerk but not in MongoDB
4. User attempts to authenticate → JWT is valid but user lookup fails → 401 Unauthorized

## Solution: Auto-Healing Authentication

The system implements automatic user synchronization that triggers during authentication when a user is missing from MongoDB.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User makes API request with valid Clerk JWT              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. JWT is decoded and validated (issuer, expiration)        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Look up user in MongoDB by clerk_id                      │
└────────────────┬────────────────────────────────────────────┘
                 │
          ┌──────┴──────┐
          │             │
          ▼             ▼
     User Found    User NOT Found
          │             │
          │             ▼
          │    ┌────────────────────────────────────────┐
          │    │ 4. Auto-sync triggered                 │
          │    │    - Fetch user from Clerk API         │
          │    │    - Extract email and name            │
          │    │    - Create user in MongoDB            │
          │    └────────┬───────────────────────────────┘
          │             │
          │      ┌──────┴──────┐
          │      │             │
          │      ▼             ▼
          │  Sync Success  Sync Failed
          │      │             │
          │      │             ▼
          │      │    Return 503 Service Unavailable
          │      │
          └──────┴─────┐
                       │
                       ▼
              ┌────────────────────┐
              │ 5. Authentication  │
              │    continues       │
              │    normally        │
              └────────────────────┘
                       │
                       ▼
                  200 OK + Data
```

### Key Features

- **Automatic**: No manual intervention required
- **Idempotent**: Safe to run multiple times
- **Race-condition safe**: Uses `find_or_create_by`
- **Graceful degradation**: Returns 503 if Clerk API is down
- **Comprehensive logging**: All sync operations logged at INFO/WARN/ERROR levels

## Architecture

### Components

1. **ClerkApiClient** (`lib/clerk_api_client.rb`)
   - HTTP client for Clerk Users API
   - Handles authentication, timeouts, rate limiting
   - Methods: `get_user(clerk_id)`, `list_users(limit:, offset:)`

2. **SyncUserFromClerkService** (`app/services/sync_user_from_clerk_service.rb`)
   - Service object for syncing a single user
   - Uses timestamp-based conditional syncing to optimize API calls
   - Stores `clerk_updated_at` in MongoDB to track when user was last updated in Clerk
   - Only updates user if Clerk's `updated_at` is newer than stored timestamp
   - Extracts email, name, and `updated_at` from Clerk API response
   - Creates user in MongoDB if not exists, or updates existing user with latest data from Clerk
   - Uses `find_or_initialize_by` pattern for race-condition safety
   - Supports `force: true` option for manual syncs (rake tasks) to always update
   - Returns Result object with success/failure

3. **Authenticatable Concern** (`app/controllers/concerns/authenticatable.rb`)
   - Modified to trigger auto-sync when user not found
   - Handles Mongoid DocumentNotFound exceptions
   - Returns appropriate HTTP status codes

### Error Handling

| Scenario | Behavior | Status Code |
|----------|----------|-------------|
| User not in MongoDB, Clerk API returns user | Create user with `clerk_updated_at`, authenticate | 200 OK |
| User exists in MongoDB | Normal auth flow (no API call, no sync) | 200 OK |
| User not in MongoDB, Clerk API down/error | Fail authentication | 503 Service Unavailable |
| User not in MongoDB, Clerk user deleted | Fail authentication | 503 Service Unavailable |
| Invalid JWT | Reject before sync attempt | 401 Unauthorized |
| Manual sync (rake task) | Always fetches from Clerk, updates if newer | N/A |

## Manual Sync Tools (Rake Tasks)

For manual operations and recovery, three rake tasks are available:

### 1. Sync Single User

Sync a specific user by their Clerk ID:

```bash
cd backend
bundle exec rake clerk:sync_user[user_2abc123def]
```

**Output:**

```
Syncing user with Clerk ID: user_2abc123def...
✓ User synced successfully:
  - Email: user@example.com
  - Name: John Doe
  - Clerk ID: user_2abc123def
  - MongoDB ID: 67890abcdef12345
```

**Note:** This task uses `force: true` to always fetch from Clerk API and update the user's email, name, and `clerk_updated_at` in MongoDB, even if the user already exists. Clerk is treated as the single source of truth. The service will still check timestamps and skip database writes if Clerk's data is not newer.

**Use cases:**

- Testing the sync functionality
- Manually fixing a specific user's sync issue
- Updating user data when it's out of sync with Clerk
- Verification after webhook failures

### 2. Bulk Sync All Users

Sync all users from Clerk to MongoDB:

```bash
cd backend
bundle exec rake clerk:sync_all_users
```

**Features:**

- Paginates through Clerk users (100 per batch)
- Safety limit: stops after 1000 users
- Shows progress and summary statistics
- Small delays to avoid rate limiting

**Output:**

```
Starting bulk user sync from Clerk...
============================================================

Fetching users (offset: 0, limit: 100)...
Fetched 100 users from Clerk
  ✓ user1@example.com (user_123)
  ✓ user2@example.com (user_456)
  ...

============================================================
Bulk sync complete!
  - Total fetched: 150
  - Successfully synced: 148
  - Failed: 2
============================================================
```

**Use cases:**

- Initial migration of existing Clerk users
- Recovery after extended downtime
- Periodic sync to catch any gaps

### 3. Audit Missing Users

Find users in Clerk that don't exist in MongoDB (read-only):

```bash
cd backend
bundle exec rake clerk:audit_missing_users
```

**Output:**

```
Auditing user sync status...
============================================================
Total Clerk users checked: 150
Missing from MongoDB: 2
============================================================

Missing users:
  - newuser@example.com (user_789)
  - testuser@example.com (user_abc)

Run 'rake clerk:sync_all_users' to sync missing users
```

**Use cases:**

- Investigation and monitoring
- Identifying sync gaps without modifying data
- Verification after bulk sync operations

## Environment Configuration

Required environment variable in `.env`:

```bash
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

This is the Clerk secret key (starts with `sk_test_` or `sk_live_`) used to authenticate API requests to Clerk.

## Logging

All sync operations are logged with appropriate levels:

- **INFO**: Successful operations (sync, auth)

  ```
  User created from Clerk: user@example.com (user_123)
  User updated from Clerk: user@example.com (user_123)
  User auto-synced successfully: user@example.com
  Authenticated user: user@example.com (user_123)
  ```

- **WARN**: User not found (triggers auto-sync)

  ```
  User not found in MongoDB for clerk_id: user_123
  ```

- **ERROR**: API failures, unexpected errors

  ```
  Auto-sync failed: Clerk API request failed
  Clerk API error: User not found in Clerk
  ```

## Testing the Implementation

### Test Auto-Healing

1. Get a user's Clerk ID from MongoDB:

   ```ruby
   rails console
   user = User.first
   clerk_id = user.clerk_id
   ```

2. Delete the user from MongoDB:

   ```ruby
   user.destroy
   ```

3. Make an authenticated API request:

   ```bash
   curl -H "Authorization: Bearer $CLERK_TOKEN" http://localhost:3001/api/pins
   ```

4. **Expected**: Request succeeds (200 OK), user auto-created in MongoDB

5. **Verify logs**:

   ```
   User not found in MongoDB for clerk_id: user_xxx
   Attempting auto-sync from Clerk API...
   User auto-synced successfully: user@example.com
   ```

### Test Rake Tasks

```bash
# Test single user sync
bundle exec rake clerk:sync_user[user_2abc123def]

# Test audit (read-only)
bundle exec rake clerk:audit_missing_users

# Test bulk sync (if needed)
bundle exec rake clerk:sync_all_users
```

## Implementation Details

### Timestamp-Based Conditional Syncing

The sync service uses a timestamp-based optimization to reduce unnecessary API calls and database writes:

1. **Stores `clerk_updated_at`**: Each user record stores the timestamp from Clerk's `updated_at` field
2. **Conditional API calls**:
   - For authentication: Only syncs if user doesn't exist (no API call for existing users)
   - For manual syncs: Always fetches from Clerk API but checks timestamps before updating
3. **Conditional updates**: Only updates MongoDB if Clerk's `updated_at` is newer than stored `clerk_updated_at`
4. **Graceful handling**: If Clerk API doesn't return `updated_at` or parsing fails, sync proceeds normally

This optimization:

- **Reduces API calls**: Existing users don't trigger Clerk API calls during authentication
- **Reduces database writes**: Skips updates when data is already current
- **Maintains data freshness**: Still syncs when Clerk data is newer
- **Industry standard**: Common pattern for syncing external data sources

### Sync Service Pattern

The `SyncUserFromClerkService` uses the Rails `find_or_initialize_by` pattern, which is the industry-standard approach for upsert operations:

- **Single code path**: Handles both create and update cases without branching
- **Race-condition safe**: `find_or_initialize_by` is atomic at the database level
- **Idiomatic Rails**: Follows Rails conventions for find-or-create operations
- **Timestamp-aware**: Checks `clerk_updated_at` to avoid unnecessary updates

This pattern is cleaner and more maintainable than separate create/update branches, and is the recommended approach in Rails applications.

## Known Limitations

1. **SSL Certificate Verification Disabled**: For development/hackathon purposes, SSL verification is disabled (`VERIFY_NONE`). For production, this should be properly configured.

2. **No JWT Signature Verification**: Currently using `JWT.decode` without verifying the signature (RS256). Production should verify with Clerk's JWKS public keys.

3. **Synchronous Sync**: Auto-sync happens during the authentication request, which adds latency. For production, consider moving to a background job.

4. **No Retry Logic**: If Clerk API fails, it returns 503 immediately. Production should implement retry with exponential backoff.

5. **Rate Limiting**: No built-in rate limit handling. If Clerk returns 429, the sync fails.

6. **Timestamp Parsing**: The service attempts to parse Clerk's `updated_at` field, which may be in Unix timestamp (milliseconds) or ISO 8601 format. If parsing fails, sync proceeds without timestamp checking.

## Future Improvements (Post-Hackathon)

For production deployment:

- [ ] Move auto-sync to background job (don't block authentication)
- [ ] Add retry logic with exponential backoff
- [ ] Implement proper JWT signature verification (RS256 with JWKS)
- [ ] Handle Clerk API rate limits gracefully (429 responses)
- [ ] Add metrics/monitoring for sync success/failure rates
- [ ] Add caching layer for Clerk API responses
- [ ] Enable SSL certificate verification properly
- [ ] Add alerting for sync failures

## Security Considerations

- **CLERK_SECRET_KEY** must be kept secure (never commit to git)
- JWT tokens are validated for issuer and expiration
- Auto-sync only triggers for valid JWT tokens
- No sensitive data logged (only email and Clerk ID)

## Troubleshooting

### "Document not found for class User"

**Cause**: Mongoid is raising exceptions instead of returning nil.

**Solution**: Already handled - the code catches `Mongoid::Errors::DocumentNotFound` and treats it as nil.

### "Clerk API request failed: SSL certificate verify failed"

**Cause**: SSL certificate verification issues.

**Solution**: Already handled - SSL verification is disabled for development.

### "User account sync failed. Please contact support."

**Cause**: Clerk API returned an error or is unreachable.

**Check**:

1. Verify `CLERK_SECRET_KEY` is correct in `.env`
2. Check network connectivity
3. Review logs for specific error message
4. Try manual sync: `bundle exec rake clerk:sync_user[clerk_id]`

### Auto-sync not triggering

**Cause**: User already exists in MongoDB or JWT is invalid.

**Check**:

1. Verify user was actually deleted from MongoDB
2. Verify JWT token is valid and not expired
3. Check logs for authentication errors
4. Verify `CLERK_SECRET_KEY` is set
