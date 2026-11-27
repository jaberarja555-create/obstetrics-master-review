-- HO Guide record visible (27 Nov 2026): a new files row is put under review by the library triggers, so the row added by 066 was not
-- published and its card had no stars, likes, comments, share or report. Same fix as 064 for the Master Review books. Safe to run again.
begin;

alter table public.files disable trigger ish_alerts;
update public.files
set status = 'published'
where id = 'c9a994a8-e7c1-42a8-b61a-933ea9a30683' and kind = 'master_review' and status is distinct from 'published';
alter table public.files enable trigger ish_alerts;

commit;
