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

### Step 1: Create a PostgreSQL database on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Fill in:
   - **Name:** `betting-app-db`
   - **Region:** Pick the closest to you
   - **Plan:** **Free**
4. Click **Create Database**
5. Once created, copy the **External Database URL** (you'll need it in Step 3)

### Step 2: Create a Web Service on Render

1. Click **New** → **Web Service**
2. Connect your GitHub repo (`betting-app`)
3. Fill in:
   - **Name:** `betting-app`
   - **Region:** Same as your database
   - **Runtime:** **Node**
   - **Build Command:** `npm install && npm run build && npx prisma db push`
   - **Start Command:** `npm start`
   - **Plan:** **Free**
4. Click **Create Web Service**

### Step 3: Set Environment Variables

In your Render web service dashboard, go to **Environment** and add:

| Key            | Value                                      |
| -------------- | ------------------------------------------ |
| `DATABASE_URL` | The External Database URL from Step 1      |
| `NODE_ENV`     | `production`                               |

### Step 4: Set up the Deploy Hook (for GitHub Actions)

1. In your Render web service dashboard, go to **Settings**
2. Scroll to **Deploy Hook** and copy the URL
3. In your GitHub repo, go to **Settings** → **Secrets and variables** → **Actions**
4. Add a new secret:
   - **Name:** `RENDER_DEPLOY_HOOK_URL`
   - **Value:** The deploy hook URL from Render

### Step 5: Deploy!

Now every time a PR is merged to `main`, the GitHub Action will trigger a deploy on Render.

You can also trigger a manual deploy from the Render dashboard.

---

## Notes

- Render free tier web services spin down after 15 minutes of inactivity. The first request after that takes ~30 seconds.
- Render free PostgreSQL databases expire after 90 days. You'll need to recreate or upgrade before then.
- For production use, upgrade to a paid plan for always-on services and persistent databases.
