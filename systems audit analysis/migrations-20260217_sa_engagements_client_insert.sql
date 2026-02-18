-- Allow clients to create/update their own sa_engagement when completing Stage 1 assessment.
-- RLS systematic review only had team_insert/team_update; client insert/update were missing.

CREATE POLICY "sa_engagements_client_insert" ON sa_engagements
  FOR INSERT
  WITH CHECK (
    client_id IN (SELECT user_client_ids())
    AND practice_id IN (SELECT user_practice_ids())
  );

CREATE POLICY "sa_engagements_client_update" ON sa_engagements
  FOR UPDATE
  USING (client_id IN (SELECT user_client_ids()));
