-- Corrige la FK de predictions.user_id para que PostgREST pueda hacer join con profiles.
-- Ejecutar en SQL Editor de Supabase si ya creaste la tabla con FK a auth.users.

alter table predictions
  drop constraint if exists predictions_user_id_fkey;

alter table predictions
  add constraint predictions_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;
