# Deployment Guide — Betting App on Render (Free Tier)

## Local Development

### 1. Start PostgreSQL with Docker

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Push the Prisma schema to the database

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Render (Free)

There are 3 ways to deploy. Pick whichever you prefer.

---

### Option A: Blueprint (Easiest — One Click)

A `render.yaml` blueprint is already included in this repo. It defines both the web service and the PostgreSQL database.

1. Go to [https://dashboard.render.com/select-repo?type=blueprint](https://dashboard.render.com/select-repo?type=blueprint)
2. Connect your GitHub account if you haven't already
3. Select the `betting-app` repository
4. Render will detect `render.yaml` and show the services to create:
   - **betting-app** (Web Service, Free)
   - **betting-app-db** (PostgreSQL, Free)
5. Click **Apply**
6. Wait for the database to provision and the web service to build and deploy
7. Once done, click your web service to find the live URL (e.g. `https://betting-app-xxxx.onrender.com`)

That's it — database connection is automatically wired via `render.yaml`.

---

### Option B: Manual Setup via Render Dashboard

#### Step 1: Create a PostgreSQL database

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name:** `betting-app-db`
   - **Database:** `betting_app`
   - **User:** leave default
   - **Region:** Oregon (or closest to you)
   - **PostgreSQL Version:** 16
   - **Plan:** **Free**
4. Click **Create Database**
5. Wait for it to provision (~1-2 minutes)
6. Once ready, go to the **Info** section
7. Copy the **Internal Database URL** (starts with `postgres://...`)

#### Step 2: Create a Web Service

1. Click **New +** → **Web Service**
2. Click **Build and deploy from a Git repository** → **Next**
3. Connect your GitHub account and select `betting-app`
4. Fill in:
   - **Name:** `betting-app`
   - **Region:** Same as your database
   - **Branch:** `main`
   - **Runtime:** **Node**
   - **Build Command:** `npm install && npm run build && npx prisma db push`
   - **Start Command:** `npm start`
   - **Plan:** **Free**
5. **Don't click Create yet** — add environment variables first

#### Step 3: Set Environment Variables

On the same page, scroll to **Environment Variables** and add:

| Key            | Value                                                    |
| -------------- | -------------------------------------------------------- |
| `DATABASE_URL` | The Internal Database URL you copied from Step 1         |
| `NODE_ENV`     | `production`                                             |

Now click **Create Web Service**.

#### Step 4: Wait for deploy

- The first build takes ~2-3 minutes
- Once status shows **Live**, click the URL at the top of the page to view your app

---

### Option C: Render REST API (from terminal)

You can create everything via the Render API using `curl` and an API key.

#### Step 1: Get your API key and Owner ID

1. Go to [https://dashboard.render.com/u/settings#api-keys](https://dashboard.render.com/u/settings#api-keys)
2. Click **Create API Key**, name it, and copy the key
3. Get your owner ID (workspace ID):

```bash
export RENDER_API_KEY="rnd_xxxxxxxxxxxxxxxx"

curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/owners | python3 -m json.tool
```

Copy the `id` field from the response:

```bash
export RENDER_OWNER_ID="own-xxxxxxxxxxxxxxxx"
```

#### Step 2: Create the PostgreSQL database

```bash
curl -s -X POST https://api.render.com/v1/postgres \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "betting-app-db",
    "ownerId": "'"$RENDER_OWNER_ID"'",
    "plan": "free",
    "region": "oregon",
    "version": "16",
    "databaseName": "betting_app"
  }' | python3 -m json.tool
```

From the response, note the `id` field. Then get the connection string:

```bash
export RENDER_DB_ID="dpg-xxxxxxxxxxxxxxxx"

curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/postgres/$RENDER_DB_ID | python3 -m json.tool
```

Copy the `connectionString` from the response (the **internal** one).

#### Step 3: Create the Web Service

```bash
export DATABASE_URL="postgres://..."  # the internal connection string from above

curl -s -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "betting-app",
    "ownerId": "'"$RENDER_OWNER_ID"'",
    "type": "web_service",
    "autoDeploy": "yes",
    "serviceDetails": {
      "runtime": "node",
      "plan": "free",
      "region": "oregon",
      "buildCommand": "npm install && npm run build && npx prisma db push",
      "startCommand": "npm start",
      "envVars": [
        { "key": "DATABASE_URL", "value": "'"$DATABASE_URL"'" },
        { "key": "NODE_ENV", "value": "production" }
      ],
      "repo": "https://github.com/sanveer-osahan/betting-app",
      "branch": "main"
    }
  }' | python3 -m json.tool
```

The service will start building immediately.

#### Step 4: Check deploy status

```bash
export RENDER_SERVICE_ID="srv-xxxxxxxxxxxxxxxx"  # from the create response

curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys | python3 -m json.tool
```

---

## Setting up Auto-Deploy via GitHub Actions

After deploying with any option above:

1. In your Render web service dashboard, go to **Settings**
2. Scroll to **Deploy Hook** and copy the URL
3. In your GitHub repo, go to **Settings** → **Secrets and variables** → **Actions**
4. Add a new repository secret:
   - **Name:** `RENDER_DEPLOY_HOOK_URL`
   - **Value:** The deploy hook URL from Render

Now every push to `main` (including merged PRs) will trigger a deploy automatically via the GitHub Action in `.github/workflows/deploy.yml`.

---

## Notes

- **Cold starts:** Free tier web services spin down after 15 minutes of inactivity. First request after that takes ~30 seconds.
- **Database expiry:** Free PostgreSQL databases expire after 90 days. Recreate or upgrade before then.
- **Internal vs External DB URL:** Use the **Internal** URL for your web service (faster, same network). Use **External** only for connecting from your local machine.
- **Production:** Upgrade to a paid plan for always-on services and persistent databases.
