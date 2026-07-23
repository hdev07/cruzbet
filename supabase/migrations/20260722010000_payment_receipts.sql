-- Comprobante de pago in-app: el jugador sube la captura de su transferencia
-- y el admin la ve al verificar, sin ping-pong por WhatsApp.
--
-- Flujo: subir imagen a Storage (bucket privado `payment-receipts`, carpeta
-- por usuario) y ligarla a base_round_payments vía RPC. El admin la abre con
-- URL firmada gracias a la policy de lectura.

-- ── Columnas en pagos ───────────────────────────────────────────────────────

alter table public.base_round_payments
  add column if not exists receipt_path text,
  add column if not exists receipt_uploaded_at timestamptz;

-- ── Bucket privado ──────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Policies de Storage: cada quien su carpeta; el admin lee todo ───────────

drop policy if exists "receipts insert own folder" on storage.objects;
create policy "receipts insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "receipts update own folder" on storage.objects;
create policy "receipts update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "receipts read own or admin" on storage.objects;
create policy "receipts read own or admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-receipts'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_jwt_admin()
    )
  );

-- ── RPC: ligar el comprobante al pago ───────────────────────────────────────

create or replace function public.set_base_payment_receipt(
  p_round_id uuid,
  p_entry_number int,
  p_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if p_entry_number is null or p_entry_number < 1 then
    raise exception 'Número de quiniela inválido';
  end if;

  -- El path debe vivir en la carpeta del propio usuario.
  if p_path is null or p_path not like v_user::text || '/%' then
    raise exception 'Ruta de comprobante inválida';
  end if;

  insert into public.base_round_payments
    (user_id, round_id, entry_number, verified, receipt_path, receipt_uploaded_at)
  values (v_user, p_round_id, p_entry_number, false, p_path, now())
  on conflict (user_id, round_id, entry_number) do update
  set
    receipt_path = excluded.receipt_path,
    receipt_uploaded_at = excluded.receipt_uploaded_at;
end;
$$;

revoke all on function public.set_base_payment_receipt(uuid, int, text) from public;
grant execute on function public.set_base_payment_receipt(uuid, int, text) to authenticated;

notify pgrst, 'reload schema';
