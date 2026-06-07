-- Functioneringsgesprek krijgt een ingeplande fase met datum/tijd. De cyclus
-- start bij 'draft' of 'scheduled', afhankelijk van of er meteen een datum
-- bekend is.
alter table performance_reviews
  add column if not exists scheduled_at timestamptz;

alter type performance_review_status add value if not exists 'scheduled';

create index if not exists performance_reviews_scheduled_idx
  on performance_reviews(scheduled_at desc);
