-- Realtime para rankings y puntos al caer goles
-- Ejecutar en SQL Editor de Supabase

alter table profiles replica identity full;
alter table predictions replica identity full;
alter table base_predictions replica identity full;

do $$
begin
  alter publication supabase_realtime add table profiles;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table predictions;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table base_predictions;
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
