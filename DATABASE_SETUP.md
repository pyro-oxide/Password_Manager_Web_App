# Database Setup Guide

This application is now connected to your MySQL database. Follow these steps to set up the connection.

## Prerequisites

1. MySQL Server running and accessible
2. Node.js and npm installed
3. The following credentials configured (matching your Python app):

## Database Credentials

The app uses environment variables for database configuration. Create a `.env.local` file in the `PMWA` directory with the following:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=K@nw@l1007
MYSQL_DATABASE=password_manager
```

## Initialization

The database will be automatically initialized when you first run the app. The `VaultInitializer` component will:

1. Ensure the database exists
2. Create necessary tables if they don't exist:
   - `passwords` - stores encrypted password entries
   - `master_password` - stores master password hash and salt
   - `settings` - stores application settings

## Database Schema

The tables match your Python app's schema:

### passwords
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `site` (VARCHAR(255))
- `username` (VARCHAR(255))
- `password` (TEXT) - encrypted using AES-256-GCM
- `website` (VARCHAR(512))
- `category` (VARCHAR(64), default: 'Uncategorized')
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### master_password
- `id` (TINYINT, PRIMARY KEY)
- `hash` (TEXT) - PBKDF2 hash of master password
- `salt` (BLOB) - salt used for password hashing
- `created_at` (TIMESTAMP)

### settings
- `key` (VARCHAR(191), PRIMARY KEY)
- `value` (TEXT)

## Security

- Master passwords are hashed using PBKDF2 with 100,000 iterations
- Individual passwords are encrypted using AES-256-GCM
- Master password is never stored in plain text
- Master password salt is stored locally for encryption/decryption during session

## API Routes

All database operations go through Next.js API routes:

- `/api/db/init` - Initialize database and tables
- `/api/master-password` - Manage master password (GET, POST, PUT, DELETE)
- `/api/master-password/verify` - Verify master password
- `/api/passwords` - CRUD operations for passwords
- `/api/passwords/decrypt` - Decrypt a password entry
- `/api/categories` - Get all categories
- `/api/settings` - Manage settings (GET, POST)

## Syncing with Existing Data

If you already have data in your database from your Python app, it will be automatically loaded when you unlock the vault. The app will:

1. Fetch all passwords from the database
2. Decrypt them using your master password
3. Display them in the UI

## Troubleshooting

### Connection Issues

If you encounter connection errors:

1. Verify MySQL is running: `mysql -u root -p`
2. Check the credentials in `.env.local`
3. Ensure the database exists (it will be created automatically if it doesn't)
4. Check firewall settings if connecting to remote MySQL server

### Encryption Errors

If passwords fail to decrypt:

1. Ensure you're using the correct master password
2. Verify the salt in the database matches what's expected
3. Check browser console for detailed error messages

### Missing Data

If data doesn't appear:

1. Check browser console for API errors
2. Verify database connection
3. Ensure master password verification succeeds
4. Check that passwords exist in the database

## Development

To test the database connection:

1. Start the development server: `npm run dev`
2. Open the app in your browser
3. The console will show database initialization status
4. Check the Network tab in DevTools to see API requests

