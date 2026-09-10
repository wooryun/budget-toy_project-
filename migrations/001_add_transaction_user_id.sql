-- Supabase SQL Editor에서 한 번만 실행하세요.
-- 기존 거래는 소유자를 알 수 없으므로 user_id가 NULL인 상태로 보존됩니다.

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx
ON public.transactions(user_id);
