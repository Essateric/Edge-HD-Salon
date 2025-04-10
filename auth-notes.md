# Authentication System Notes

## Password Hashing Format
The system uses bcrypt for password hashing. Important notes:

1. All password hashes should use the `$2b$` format (not `$2a$`)
2. The bcrypt implementation in NodeJS uses `$2b$` format by default 
3. If you see authentication failures, check the hash format in the database

## Default Test Accounts
For development and testing purposes, these accounts are available:

- Admin: `shabnam@theedgesalon.com` / `password123`
- Stylist: `martin@theedgesalon.com` / `password123`
- Test: `test@theedgesalon.com` / `password123`

## Debugging Tips
If authentication issues occur:
1. Check the server logs for "Password valid: false/true" messages
2. Verify the hash format in the database starts with `$2b$`
3. Use the following SQL to check all password hash formats:
   ```sql
   SELECT id, username, SUBSTRING(password, 1, 4) as hash_prefix FROM users;
   ```

## Required Permissions
Different endpoints require different permissions:
- Viewing appointments requires the `view_all_appointments` permission
- Booking appointments requires the `book_appointments` permission
- Managing users requires the `manage_users` permission

These permissions are assigned based on user roles.