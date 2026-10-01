begin;

-- Mirrors payments.invoice_id on the customer side: lets a vendor payment
-- point at the exact purchase bill it settles, instead of only moving the
-- supplier's aggregate running balance. Without this, a bill's own
-- paid/partial/pending status can't be shown - only "the supplier owes
-- NPR x overall", which doesn't say which bills that covers.
alter table vendor_ledger_entries
  add column if not exists business_transaction_id uuid references business_transactions(id) on delete set null;

create index if not exists vendor_ledger_entries_business_transaction_idx
  on vendor_ledger_entries (business_transaction_id);

commit;
