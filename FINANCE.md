# The finance layer

BulkTrack records what was sold and what came in. It does not have books:
no cash position, nowhere to record what the business spends or owes its
own suppliers, and no profit figure that counts anything but sales.

This is that layer. It sits underneath what already exists rather than
replacing any of it — `sales` and `payments` keep their shape and keep
driving the pages that read them.

Ported from the Jageer Nepal finance system, adapted to this codebase.

---

## The model, in four rules

Everything here follows from these. They are worth reading once, because
each one is a place where the obvious implementation is wrong.

**1. A sale is not money.** It records that a customer now owes us. The
cash arrives later, as a payment. A 12,000 sale moves "to receive" by
12,000 and the bank balance by nothing.

**2. An expense is money.** It is paid on the spot, so it is cash out the
moment it is recorded. It is the only bill that behaves this way.

**3. A bill with no party is money too.** A walk-in has no ledger that
will ever settle it, so the cash moved when it was recorded. This is the
one exception to rule 1, and it is why `settledOnSpot()` exists.

**4. Cash in hand is `bank_account_id = null`.** Not a row in
`bank_accounts`. Everything buckets null as cash — adding a "Cash"
account would double-count it.

Two more things that surprise people:

- **`customers` holds suppliers too.** The same row is a customer when
  they buy and a vendor when we buy from them. Which side they are on is
  decided per entry by which ledger it lands in, never by a flag. Someone
  can owe us 5,000 and be owed 2,000 at the same time, and both numbers
  are shown rather than netted.
- **Every entry's date is `entry_date ?? created_at`.** The date a person
  typed always wins. Get this wrong and a back-dated entry lands in
  different months on different screens.

---

## What is here

### `supabase/migrations/20260930030000_finance_module.sql`

Eight new tables, their policies, and the triggers that keep them in step:

| Table | Holds |
|---|---|
| `customer_ledger_entries` | What each customer owes and has paid |
| `vendor_ledger_entries` | What we owe each supplier and have paid them |
| `business_transactions` | Purchase bills, expenses, and sales not made through `sales` |
| `bank_accounts` | Where money sits (cash is the absence of one) |
| `account_transfers` | Moving our own money between our own accounts |
| `expense_categories` | Fuel, rent, salary… |
| `finance_items` | Line-item names typed on bills, remembered for next time |
| `statement_imports` | Which bank statement lines have already been imported |

Two triggers mirror `sales` and `payments` into the customer ledger, and
a backfill brings across everything already recorded. After that, a
customer's outstanding balance has **one** definition that expenses, bank
accounts and the day book can all read — instead of being recomputed on
each page.

Three differences from the system this came from, each forced by this
codebase rather than chosen:

1. **No `owner_id`.** That system is multi-tenant. This is an internal
   single-business tool, so these tables use the same "any authenticated
   staff member, full access" policy the existing tables use. Making
   BulkTrack multi-tenant later is a schema-wide change, not a finance one.
2. **`customers` is reused, not re-created.** So party ids are `text`,
   matching its slug ids.
3. **Finance rows get server-side uuid keys**, rather than the
   client-generated `SL-1042` style ids the older tables use. Nothing
   here is referred to by a human-readable reference.

#### It also fixes a bug that would have corrupted the books

A sale's value was computed live as `products.price × qty`. Editing a
product's price silently rewrote the value of **every past sale of it** —
last month's revenue changing because someone updated a price list today.

Tolerable while the number only ever appears on a screen. Not tolerable
once it is booked into a ledger and reconciled against cash. So sales now
capture `unit_price` when they are made, existing rows are backfilled from
current prices (the best guess available for them), and everything reads
`coalesce(unit_price, price)` so it is correct either way.

### `frontend/src/lib/finance.js`

Where every money figure comes from. Party balances, the cash position
across cash-in-hand and each bank account, money in and out over a period,
profit and loss, and the day book.

The temptation is to work each of these out on the page that shows it — it
is only a reduce, after all. Do that and the Dashboard and the Day Book
quietly disagree about what today's cash was, with neither obviously
wrong. One definition each; the pages call them.

### `frontend/src/pages/admin/DayBook.jsx`

One day laid out like a paper cash book. Sales and purchases show what was
**billed** and leave the running balance alone; payments, expenses and
supplier payments **move** it. So a sale appears twice — once when it is
made, and again, for whatever was actually collected, when the money
arrives.

Entries open for editing, except the ones a sale or payment wrote. Those
say so instead: the database refuses those edits anyway, and being told
why beats a failed save.

The opening balance is the cash-position function called with a date
cutoff, not a second calculation of its own — so today's closing balance
and tomorrow's opening balance cannot drift apart.

### `frontend/src/context/FinanceContext.jsx`

Loads the new tables and subscribes to them. Kept apart from
`DataContext` deliberately: that one is about what was sold and shipped,
this is about what it did to the money, and merging them would make a
700-line provider nobody wants to read.

Realtime matters more here than elsewhere. A sale recorded on another
device writes its ledger entry through a database trigger, so this client
never sees that write as its own mutation — realtime is the only way it
arrives.

---

## Applying it

The migration has **not** been applied to the hosted project yet.

```bash
supabase link --project-ref <ref>
supabase db push
```

That records it in `supabase_migrations.schema_migrations` alongside the
existing five, which is what keeps future migrations lined up. If it is
ever applied by hand instead, insert the version row too or the CLI will
try to run it again.

The backfill is `on conflict do nothing`, so re-running is safe. The first
run does write real rows — one ledger entry per existing sale and payment
— so take a backup first.

---

## What has been verified

**The migration**, against a copy of this schema, with data inserted
*before* it ran so the backfill was exercised the way it really will be:

- the backfill brings existing sales and payments across
- a new sale books its debt; a payment clears it
- editing a sale moves its debt instead of adding a second one
- deleting a sale or a payment takes its entry with it
- a purchase books a payable without touching the receivable
- an expense books no ledger row at all
- changing a product's price no longer rewrites booked sales
- the ledger balance equals the `outstanding` figure the app already
  computes — the one that matters, because if these disagreed the finance
  screens would contradict a page people already trust

**The money module**, via `npm test` — a made-up day of trading (credit
sale, part payment, expense, walk-in, supplier bought from and paid,
transfer), checking the receivable and the balance after every step, that
the two totals formulas agree with them, and that tomorrow opens where
today closed.

`npm run lint` is clean and `npm run build` passes.

**Not yet verified:** the migration against the hosted database, and the
RLS rules under a real signed-in session. Direct database connections run
as superuser, which bypasses RLS entirely, so the rule that
trigger-written entries can be read but not edited still needs testing
from the app.

---

## What is left

In dependency order — each only needs the ones above it:

1. **Ledger balances on the Customers page.** Worth doing first: the page
   currently recomputes `outstanding` its own way, so that number has two
   sources of truth right now.
2. **Received / Payment Out forms** — recording money against a customer
   or a supplier directly, rather than only against a sale.
3. **Purchase and expense entry** — the screens for
   `business_transactions`.
4. **Bank accounts and transfers.**
5. **Profit and loss** — `report()` already exists in the money module;
   this is a page over it. Note the current Reports page's "Sales trend —
   last 30 days" chart is a hardcoded SVG polyline, not data.
6. **Statement import** — parse a bank export, drop rows already imported
   by reference code, classify, review, commit.

### Two loose ends worth knowing about

- **Payments all land as cash in hand.** `payments.method` is free text
  (`"Bank Transfer"`, `"Cash on Delivery"`) and the mirrored ledger entry
  has no `bank_account_id`, so it counts as cash. The totals are right;
  the cash/bank split is not. Once bank accounts exist, `method` should
  map to one.
- **`DataContext.addSale` does not send `unit_price`.** A trigger fills
  it, so nothing breaks — but the code that knows the price should be the
  one recording it.
