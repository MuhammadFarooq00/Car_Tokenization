-- Disable FK checks temporarily
SET session_replication_role = replica;

-- Clear existing data (order matters due to FK)
TRUNCATE TABLE public.expenses CASCADE;
TRUNCATE TABLE public.dividends CASCADE;
TRUNCATE TABLE public.rides CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.share_holdings CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.user_wallets CASCADE;
TRUNCATE TABLE public.listings CASCADE;
TRUNCATE TABLE public.driver_applications CASCADE;
TRUNCATE TABLE public.driver_profiles CASCADE;
TRUNCATE TABLE public.kyc_verifications CASCADE;
TRUNCATE TABLE public.blockchain_sync_state CASCADE;
TRUNCATE TABLE public.cars CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- Re-enable FK
SET session_replication_role = DEFAULT;
