-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Invoices Table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  voucher_number text not null unique,
  voucher_type text not null default 'sales_bill',
  party_name text not null,
  party_gstin text,
  billing_address text,
  place_of_supply text,
  subtotal numeric(12, 2) not null default 0.00,
  total_tax numeric(12, 2) not null default 0.00,
  grand_total numeric(12, 2) not null default 0.00,
  status text not null default 'pending', -- pending, approved, cancelled
  irn text,
  eway_bill_no text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoice Line Items Table
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  item_name text not null,
  hsn_code text,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0.00,
  tax_rate numeric(5, 2) not null default 18.00,
  cgst_amount numeric(12, 2) not null default 0.00,
  sgst_amount numeric(12, 2) not null default 0.00,
  igst_amount numeric(12, 2) not null default 0.00,
  total_item_amount numeric(12, 2) not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Policies for public access (or authenticated users)
create policy "Allow read access for all users" on public.invoices for select using (true);
create policy "Allow insert access for all users" on public.invoices for insert with check (true);
create policy "Allow update access for all users" on public.invoices for update using (true);

create policy "Allow read access for all items" on public.invoice_items for select using (true);
create policy "Allow insert access for all items" on public.invoice_items for insert with check (true);
create policy "Allow update access for all items" on public.invoice_items for update using (true);

-- Enable Supabase Realtime for cross-device sync
alter publication supabase_realtime add table public.invoices;
alter publication supabase_realtime add table public.invoice_items;
