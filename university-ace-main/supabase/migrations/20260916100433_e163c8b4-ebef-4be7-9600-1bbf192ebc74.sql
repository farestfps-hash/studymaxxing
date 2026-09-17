ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sat_score integer,
  ADD COLUMN IF NOT EXISTS act_score integer,
  ADD COLUMN IF NOT EXISTS unt_score integer,
  ADD COLUMN IF NOT EXISTS nuet_score integer,
  ADD COLUMN IF NOT EXISTS annual_budget numeric,
  ADD COLUMN IF NOT EXISTS budget_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS needs_full_aid boolean NOT NULL DEFAULT false;

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT 'blue';