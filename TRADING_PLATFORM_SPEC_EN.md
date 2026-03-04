# Trading Platform Specification (English)

## Visual & UI Reference

- **Reference platform:** https://mt.match-trade.com/app/trade  
- The platform must look **visually identical** to this reference: same layout, features, and behavior.
- **Dark theme:** same colors as Match Trader dark interface.
- **Light theme:** NexasTrade colors — white and dark blue (nexastrade.com).
- **Symbols/pairs panel:** on the left, with the same expand/collapse behavior as the reference.

---

## Balance & Account Display

- Balance, profit/loss, etc. must be **selectable**.
- The **account type** currently being viewed must be shown on the **right**, next to the arrow indicator.

---

## Chart & Trading

- **Chart** must be fully operational and open/close trades the same way as Match Trader (lots, order types, etc.).
- **Demo login:**  
  - URL: https://mt.match-trade.com/login  
  - Email: demotest@demotest.com  
  - Password: drbfxmngrl21  

---

## Advanced Orders

When the user clicks **“Advanced Orders”**, the following options must be available:

### 1. Trade

- Client opens and closes trades **on their own**.
- **Sub-sections:**
  - **Open positions** — real-time open orders.
  - **Pending orders** — pending orders list.
  - **Closed positions** — closed trades with P&amp;L, etc.
  - **Finances** — deposits and withdrawals made from this account.

**Funding rule:**  
Deposits and withdrawals are done on the **master account**. The client then moves funds internally from master to trading/plans. So: fund the master account first, then internal transfer to the trading/plans account.

---

### 2. Institutional

- Trades are **managed by the Admin**. The client **cannot** open trades; they can only view what was opened/closed on their account.
- Admin can open/close trades **manually** and set custom times and results.  
  Example: at 11:00, Admin can record that a trade was opened at 09:00 with X lots and closed at 10:00 with X profit/loss.  
  Use case: marketing videos and controlled demo content.

**Sub-sections (same structure as Trade):**

- Open positions  
- Pending orders  
- Closed positions  
- Finances  

**Funding rule:**  
Same as Trade: deposit/withdraw on the **master account**, then internal transfer to this institutional account.

---

### 3. Plans

- **Duration** and **periodic returns** (e.g. plan of 1 month, every week earn X% or X USD/EUR).
- Returns configurable as **percentage** or **fixed amount**, applied automatically.

**UI:**

- Section title: “Plans”.
- Styling: Match Trader dark theme; light theme = NexasTrade (white + dark blue).
- Each plan shows: **duration**, **minimum** and **maximum** amount.
- On **“Invest”** click → open a tab/modal to enter the investment amount.

**Funding:**

- Investment comes from the **master wallet** (the one used for deposits and withdrawals).
- After investing, the client sees the plan with its **accrued benefits**.

**Admin:**

- Admin sets plan returns in **USD** or **%**, or can manually set a specific amount.

**Funding rule:**  
Deposits/withdrawals go to the **master account**. Client moves funds to plans via internal transfer. When the plan ends, proceeds are credited back to the **master account**.

---

### 4. Prop

- **Challenge status** — where the user sees challenge progress and statistics.
- **New challenges** — list of available challenges.
- Behavior and layout aligned with Match Trader.  
  This is used as **demo** for now (no real challenge sales yet) — like a “training ground” for challenges.

---

### 5. Dashboard

- Client sees **account analytics** for the selected account/context.

---

### 6. News

- News section as in the reference platform.

---

## Account Section

When the user opens **Account**, include:

- **Account settings**
- **Finances**
- **Language**
- **Dark mode / Light mode**
- **Log out**

**Note:** Clicking “Account settings” or “Finances” should take the user to their **personal/client area** (see below).

---

## Personal / Client Area

Same visual style: Match Trader dark theme; NexasTrade light (white + dark blue).

**Structure:**

1. **Control panel**
   - **Master account balance** — where deposits and withdrawals are made.
   - Balances of **trading account**, **demo**, **prop**, **plans**, and any other accounts created by the user.
   - **History** of actions (transfers, deposits, withdrawals, etc.).

2. **Deposit**
   - For now: **crypto only** (later: cards, etc. when merchant is ready).
   - Accepted: USDC, USDT, BTC, etc.
   - Show **QR code** and **wallet address** (copyable).
   - After initiating deposit: option to **upload proof** — screenshot of the transaction and amount, or **transaction hash (txID)**.

3. **Withdrawals**
   - User selects the **master account**.
   - Next step: select **crypto** (later: card, PayPal, bank).
   - User enters **withdrawal wallet** and confirms.  
   - Withdrawals are from the master account.

4. **Internal transfer (Exchange)**
   - Transfer between the user’s own accounts.  
   - Examples: master → trading account; trading account → master (e.g. to then withdraw).

5. **Account settings**
   - Client profile: **profile photo**, name, surname, phone, date of birth, gender, address.
   - **Privacy** and **password change**.

6. **KYC verification**
   - Front ID, back ID, selfie, **Address (utility bill)**.

---

## Reference Links & Logins

- **PaySnap demo (reference for flows):**  
  https://paysnap.circlecodes.co/signin  

- **CRM / Admin:**  
  - URL: https://mtco.match-trade.com/admin/login  
  - Email: testbrokerco@mailinator.com  
  - Password: abcd1234  

- **Match Trader demo (trading UI):**  
  - URL: https://mt.match-trade.com/login  
  - Email: demotest@demotest.com  
  - Password: drbfxmngrl21  

---

## Admin Section

*Question left in original spec:*  
Do you want the Admin section specified in detail, or will you adapt it yourself to match the same graphic/UI rules (Match Trader dark, NexasTrade light white + dark blue)?
