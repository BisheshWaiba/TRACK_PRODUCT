// Run with: npm test
//
// The money module has no UI and no database, so it can be checked the
// cheap way: a made-up day of trading, and the figures it must produce.
// If one of these fails, some screen is about to show a wrong number.
// The scenario from FINANCE-SPEC.md §3.2, run against the real module.
import { partyBalances, accountBalances, receivedAndPaid, profitAndLoss, dayBook } from "./finance.js";

const D = '2026-09-30';
const bank = { id: 'bank-1', name: 'Nabil' };
const parties = [{ id: 'ram', name: 'Ram' }, { id: 'shyam', name: 'Shyam' }];

// Built up step by step, exactly as the table in the spec reads.
const customerEntries = [];
const vendorEntries = [];
const transactions = [];
const transfers = [];
const accounts = [bank];
const data = { customerEntries, vendorEntries, transactions, transfers, accounts, parties };

let step = 0;
const results = [];
function check(label, receivable, balance) {
  const pb = partyBalances(customerEntries, vendorEntries);
  const ab = accountBalances(data);
  const okR = pb.totalReceivable === receivable;
  const okB = ab.total === balance;
  results.push(
    `${++step}. ${label}\n   to receive ${pb.totalReceivable} (want ${receivable}) ${okR ? 'ok' : 'WRONG'}` +
    ` | balance ${ab.total} (want ${balance}) ${okB ? 'ok' : 'WRONG'}`
  );
  return okR && okB;
}

let allOk = true;
const and = (v) => { allOk = allOk && v; };

// 1. sell 10,000 to Ram on credit -> a debt, not money
customerEntries.push({ id: 'e1', customerId: 'ram', entryType: 'debit', amount: 10000, source: 'booking', sourceType: 'sale', sourceId: 'SL-1', bankAccountId: null, entryDate: D, createdAt: D + 'T10:00:00Z' });
and(check('sell 10,000 to Ram on credit', 10000, 0));

// 2. receive 4,000 cash
customerEntries.push({ id: 'e2', customerId: 'ram', entryType: 'credit', amount: 4000, source: 'booking', sourceType: 'payment', sourceId: 'PM-1', bankAccountId: null, entryDate: D, createdAt: D + 'T11:00:00Z' });
and(check('receive 4,000 from Ram (cash)', 6000, 4000));

// 3. an expense of 1,000, cash
transactions.push({ id: 't1', type: 'expense', amount: 1000, partyId: null, partyName: 'Fuel', bankAccountId: null, billDate: D, createdAt: D + 'T12:00:00Z' });
and(check('expense 1,000 (cash)', 6000, 3000));

// 4. a walk-in sale with no party: money on the spot
transactions.push({ id: 't2', type: 'sale', amount: 2000, partyId: null, partyName: 'Walk-in', bankAccountId: null, billDate: D, createdAt: D + 'T13:00:00Z' });
and(check('walk-in sale 2,000, no party', 6000, 5000));

// 5. buy 3,000 from Shyam on credit
transactions.push({ id: 't3', type: 'purchase', amount: 3000, partyId: 'shyam', partyName: 'Shyam', bankAccountId: null, billDate: D, createdAt: D + 'T14:00:00Z' });
vendorEntries.push({ id: 'v1', vendorId: 'shyam', entryType: 'debit', amount: 3000, source: 'booking', sourceType: 'business_transaction', sourceId: 't3', bankAccountId: null, entryDate: D, createdAt: D + 'T14:00:00Z' });
and(check('buy 3,000 from Shyam on credit', 6000, 5000));
const payableNow = partyBalances(customerEntries, vendorEntries).totalPayable;
results.push(`   to pay ${payableNow} (want 3000) ${payableNow === 3000 ? 'ok' : 'WRONG'}`);
and(payableNow === 3000);

// 6. pay Shyam
vendorEntries.push({ id: 'v2', vendorId: 'shyam', entryType: 'credit', amount: 3000, source: 'manual', bankAccountId: null, entryDate: D, createdAt: D + 'T15:00:00Z' });
and(check('pay Shyam 3,000', 6000, 2000));
const payableAfter = partyBalances(customerEntries, vendorEntries).totalPayable;
results.push(`   to pay ${payableAfter} (want 0) ${payableAfter === 0 ? 'ok' : 'WRONG'}`);
and(payableAfter === 0);

// 7. move 1,000 cash into the bank: total unchanged, split moves
transfers.push({ id: 'tr1', fromAccountId: null, toAccountId: 'bank-1', amount: 1000, transferDate: D, createdAt: D + 'T16:00:00Z' });
and(check('transfer 1,000 cash -> bank', 6000, 2000));
const ab = accountBalances(data);
const split = ab.cash === 1000 && ab.perAccount[0].balance === 1000;
results.push(`   split cash ${ab.cash} / ${bank.name} ${ab.perAccount[0].balance} (want 1000 / 1000) ${split ? 'ok' : 'WRONG'}`);
and(split);

// --- the other two formulas ---
const rp = receivedAndPaid(data);
const rpOk = rp.received === 6000 && rp.paid === 4000;
results.push(`\nreceived ${rp.received} (want 6000: 4,000 collected + 2,000 walk-in), paid ${rp.paid} (want 4000: 1,000 expense + 3,000 supplier) ${rpOk ? 'ok' : 'WRONG'}`);
and(rpOk);

const pl = profitAndLoss({ sales: [{ date: D, value: 10000 }], transactions });
const plOk = pl.sale === 12000 && pl.purchase === 3000 && pl.expense === 1000 && pl.net === 8000;
results.push(`P&L sale ${pl.sale} purchase ${pl.purchase} expense ${pl.expense} net ${pl.net} (want 12000/3000/1000/8000) ${plOk ? 'ok' : 'WRONG'}`);
and(plOk);

// --- the day book for that day ---
const db = dayBook(data, D);
const bookOk = db.opening === 0 && db.totalIn === 6000 && db.totalOut === 4000 && db.closing === 2000;
results.push(`\nday book: opening ${db.opening} + in ${db.totalIn} - out ${db.totalOut} = closing ${db.closing} (want 0/6000/4000/2000) ${bookOk ? 'ok' : 'WRONG'}`);
and(bookOk);
results.push('rows: ' + db.rows.map((r) => `${r.kind}${r.cashIn ? ' +' + r.cashIn : ''}${r.cashOut ? ' -' + r.cashOut : ''}${r.billed ? ' [billed ' + r.billed + ']' : ''}`).join(', '));

// a document row must never move the balance
const docsClean = db.rows.filter((r) => r.kind === 'purchase' || r.kind === 'transfer').every((r) => r.balance === null);
results.push(`documents (purchase, transfer) leave the balance alone: ${docsClean ? 'ok' : 'WRONG'}`);
and(docsClean);

// opening balance on the following day must equal today's closing
const nextDay = dayBook(data, '2026-10-01');
const carries = nextDay.opening === db.closing;
results.push(`tomorrow opens where today closed (${nextDay.opening} = ${db.closing}): ${carries ? 'ok' : 'WRONG'}`);
and(carries);

console.log(results.join('\n'));
console.log('\n' + (allOk ? 'ALL CHECKS PASSED' : 'SOMETHING IS WRONG'));
process.exit(allOk ? 0 : 1);
