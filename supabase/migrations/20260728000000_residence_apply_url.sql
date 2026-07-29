-- Residence application links: lets the public residences directory route a
-- click through to each house's application app (owner-directed flow, see
-- docs/recoveryos/04-residence-application-flow.md).
-- Additive only: one nullable column + Grace House seed.

begin;

alter table gfa_residence.public_profiles
  add column if not exists apply_url text;

comment on column gfa_residence.public_profiles.apply_url is
  'URL of this residence''s application/intake app (e.g. Grace House -> gracehouse4.pages.dev). Null = no online application yet; UI falls back to phone/contact.';

update gfa_residence.public_profiles
set apply_url = 'https://gracehouse4.pages.dev/',
    application_process = 'Read the house documents and rules online, then complete the application — it saves as you go. The Grace House team reviews and reaches out about a bed or the waitlist, and you''ll be invited into the VRCC.'
where residence_id = '22222222-2222-2222-2222-222222222201';

commit;
