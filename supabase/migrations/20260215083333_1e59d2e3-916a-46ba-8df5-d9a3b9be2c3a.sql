
-- Fix collaboration messages SELECT policy to allow project owners to see all messages
DROP POLICY IF EXISTS "Project members can view messages" ON public.collaboration_messages;

CREATE POLICY "Project members can view messages"
  ON public.collaboration_messages FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = collaboration_messages.project_id
      AND p.user_id = auth.uid()
    )
  );
