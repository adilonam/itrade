# Investment Maturity Scheduling - Implementation Checklist

## Phase 1: Environment Setup

- [ ] Generate a secure CRON_SECRET
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Add `CRON_SECRET=your-generated-secret` to `.env` file
- [ ] Restart your development server to load the new env variable

## Phase 2: Test the Maturity Endpoint Manually

- [ ] Start your local server (`npm run dev`)
- [ ] Test the endpoint with curl:
  ```bash
  curl -X POST http://localhost:3000/api/schedule/mature-investments \
    -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
    -H "Content-Type: application/json"
  ```
- [ ] Check response - should return success with 0 investments processed (if none are matured)

## Phase 3: Create a Test Investment That Will Mature

- [ ] Go to your app and create a test investment as a user
- [ ] Open Prisma Studio: `npx prisma studio`
- [ ] Find the `user_investments` table
- [ ] Find your test investment and edit the `endDate` to yesterday's date
- [ ] Save the change

## Phase 4: Test Investment Maturity Processing

- [ ] Run the curl command again (from Phase 2)
- [ ] Check the response - should show 1 investment processed
- [ ] Verify in Prisma Studio:
  - [ ] UserInvestment `status` changed to `COMPLETED`
  - [ ] User `balance` increased by (amount + expectedReturn)
  - [ ] Two new transactions created: DEPOSIT + GAIN
  - [ ] Investment `currentCapacity` decreased

## Phase 5: Set Up Automated Scheduling (Choose ONE)

### Option A: Vercel Cron (Recommended if using Vercel)

- [ ] Create or update `vercel.json` in project root:
  ```json
  {
    "crons": [
      {
        "path": "/api/schedule/mature-investments",
        "schedule": "0 0 * * *"
      }
    ]
  }
  ```
- [ ] Update the auth check in `src/app/api/schedule/mature-investments/route.ts`:

  ```typescript
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const hasValidToken = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !hasValidToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```

- [ ] Commit and push to deploy
- [ ] Add `CRON_SECRET` to Vercel environment variables
- [ ] Wait for next scheduled run (midnight UTC) or check logs

### Option B: GitHub Actions

- [ ] Create `.github/workflows/mature-investments-cron.yml`:
  ```yaml
  name: Mature Investments Cron
  on:
    schedule:
      - cron: '0 0 * * *'
    workflow_dispatch:
  jobs:
    mature-investments:
      runs-on: ubuntu-latest
      steps:
        - name: Trigger Maturity Check
          run: |
            curl -X POST ${{ secrets.APP_URL }}/api/schedule/mature-investments \
              -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
  ```
- [ ] Add secrets to GitHub repo:
  - [ ] `APP_URL` = your production URL
  - [ ] `CRON_SECRET` = your secret
- [ ] Test manually: Go to Actions tab → Select workflow → Run workflow
- [ ] Check logs to verify it ran successfully

### Option C: External Cron Service (cron-job.org)

- [ ] Sign up at https://cron-job.org
- [ ] Create new cron job:
  - [ ] Title: "Mature Investments"
  - [ ] URL: `https://your-app.com/api/schedule/mature-investments`
  - [ ] Schedule: `0 0 * * *` (daily at midnight)
  - [ ] Request method: POST
  - [ ] Add header: `Authorization: Bearer YOUR_CRON_SECRET`
- [ ] Enable the cron job
- [ ] Test with "Run now" button
- [ ] Check execution history

## Phase 6: Production Deployment

- [ ] Deploy your code to production
- [ ] Set `CRON_SECRET` in production environment variables
- [ ] Verify the cron job is scheduled/enabled
- [ ] Check logs after first scheduled run
- [ ] Verify a real investment matures correctly

## Phase 7: Monitoring (Optional but Recommended)

- [ ] Set up email/Slack notifications for cron failures
- [ ] Create a simple dashboard to view cron execution history
- [ ] Add logging to track processed investments
- [ ] Set up alerts if no investments processed for 7+ days

## Quick Test Commands

### Check if endpoint is accessible:

```bash
curl -i -X POST http://localhost:3000/api/schedule/mature-investments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Check investments that should mature:

```sql
-- Run in Prisma Studio SQL query
SELECT id, amount, endDate, status
FROM user_investments
WHERE status = 'ACTIVE' AND endDate <= NOW();
```

### Check recent transactions:

```sql
-- Run in Prisma Studio SQL query
SELECT type, absoluteAmount, description, createdAt
FROM transactions
WHERE description LIKE '%Investment%'
ORDER BY createdAt DESC
LIMIT 10;
```

## Troubleshooting

**Cron not running?**

- [ ] Verify `CRON_SECRET` matches in code and cron service
- [ ] Check that endpoint is publicly accessible (not localhost)
- [ ] Verify the schedule syntax is correct
- [ ] Check cron service logs for errors

**Investments not maturing?**

- [ ] Verify `endDate` is in the past
- [ ] Check `status` is `ACTIVE`
- [ ] Look at API response for error messages
- [ ] Check server logs for exceptions

**Transactions not created?**

- [ ] Verify the transaction creation code isn't commented out
- [ ] Check database for constraint violations
- [ ] Ensure Prisma Client is up to date (`npx prisma generate`)

---

**✅ You're done when:**

1. Manual curl test works and processes a test investment
2. Automated cron is scheduled and running
3. At least one real investment has matured successfully via cron
4. User received the correct balance and transactions were created
