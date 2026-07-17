-- Liga MX vende los derechos de TV por club (no hay API pública con esta info),
-- así que el canal de transmisión se guarda como dato editable por partido.
-- Puede tener varios códigos separados por coma (ej. 'canal5,tudn,vix') cuando
-- un partido se retransmite en simultáneo por más de una señal.
alter table public.matches add column if not exists broadcast_channel text;
