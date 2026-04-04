-- ============================================================================
-- Enable Realtime Publications (if not already enabled)
-- ============================================================================
DO $$
BEGIN
  -- Try to add tables to realtime, ignore if already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE captures;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE likes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- Create Storage Bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Policies
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload files') THEN
    CREATE POLICY "Users can upload files"
      ON storage.objects FOR INSERT
      WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own files') THEN
    CREATE POLICY "Users can view own files"
      ON storage.objects FOR SELECT
      USING (auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own files') THEN
    CREATE POLICY "Users can delete own files"
      ON storage.objects FOR DELETE
      USING (auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
