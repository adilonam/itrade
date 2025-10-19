# Prompt: Test & Fix Investment Maturity Scheduling

I have an investment feature in my Next.js trading app where users can invest money in time-based investment opportunities. When an investment reaches its end date (maturity), it should automatically:

1. Change status from ACTIVE to COMPLETED
2. Return the principal + returns to user's balance
3. Create DEPOSIT and GAIN transactions

I've created a scheduled endpoint `/api/schedule/mature-investments` that processes matured investments, but I need you to verify it's working correctly.

## Your Tasks:

1. **Review the endpoint** at `src/app/api/schedule/mature-investments/route.ts` - check the logic is correct

2. **Test it works:**

   - Generate a CRON_SECRET and add to `.env`
   - Create a test investment as a user
   - Use Prisma Studio to set the investment's `endDate` to yesterday
   - Call the endpoint with curl:
     ```bash
     curl -X POST http://localhost:3000/api/schedule/mature-investments \
       -H "Authorization: Bearer YOUR_CRON_SECRET"
     ```
   - Verify the response shows 1 investment processed
   - Check in Prisma Studio that:
     - UserInvestment status = COMPLETED
     - User balance increased correctly
     - Two transactions created (DEPOSIT + GAIN)

3. **Fix any issues** you find in the code

4. **Set up scheduling** using Vercel Cron by adding to `vercel.json`:

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

   And update the auth check to accept Vercel's `x-vercel-cron` header.

5. **Report back** with:
   - What issues you found (if any)
   - What you fixed
   - Confirmation that test investment matured successfully

The database schema uses `absoluteAmount` field for transactions. Check `prisma/schema.prisma` for the exact models if needed.
