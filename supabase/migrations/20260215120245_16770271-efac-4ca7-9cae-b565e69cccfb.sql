-- Clean up duplicate project_memory rows, keeping only the most recent per project
DELETE FROM public.project_memory
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id) id
  FROM public.project_memory
  ORDER BY project_id, updated_at DESC
);

-- Add unique constraint on project_id so upsert works
ALTER TABLE public.project_memory
ADD CONSTRAINT project_memory_project_id_unique UNIQUE (project_id);