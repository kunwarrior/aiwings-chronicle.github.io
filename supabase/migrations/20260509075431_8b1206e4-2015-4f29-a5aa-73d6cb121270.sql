ALTER TABLE public.team_members REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;