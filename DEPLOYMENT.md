# Deployment Guide for Vercel

## Issues Fixed:
1. Changed database from SQLite to PostgreSQL for Vercel compatibility
2. Added proper build scripts with Prisma generation
3. Created Vercel configuration

## Steps to Deploy Successfully:

### 1. Set up Database (Choose One):

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the connection string

#### Option B: Supabase (Free Alternative)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string

#### Option C: Neon (Free PostgreSQL)
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string

### 2. Set Environment Variables in Vercel:
Go to your Vercel project settings and add these environment variables:

```
DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=a-long-random-string-at-least-32-characters
NEXTAUTH_URL=https://moodle-flow.vercel.app
NODE_ENV=production
```

### 3. Deploy:
```bash
# Commit your changes
git add .
git commit -m "Fix deployment configuration"
git push

# Or redeploy in Vercel dashboard
```

### 4. Run Database Migration:
After successful deployment, you'll need to run the database migration:

```bash
# If using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
npx prisma db seed

# Or set up in Vercel Functions
```

## Common Issues:

1. **"Default Next.js page"** - Database connection failed or environment variables missing
2. **Build errors** - Missing Prisma client generation (fixed in package.json)
3. **Auth errors** - NEXTAUTH_URL not set correctly
4. **Database errors** - Connection string format or database not accessible

## Quick Fix for Immediate Deployment:

If you want to deploy quickly with SQLite for testing:

1. Change prisma/schema.prisma back to:
   ```
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. Add to vercel.json:
   ```json
   {
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

3. Set environment variables in Vercel:
   ```
   DATABASE_URL=file:./dev.db
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://moodle-flow.vercel.app
   ```

Note: SQLite won't persist data between deployments, but will allow you to test the deployment.