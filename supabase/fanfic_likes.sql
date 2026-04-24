DROP POLICY IF EXISTS "fanfic_likes_select" ON fanfic_likes;
DROP POLICY IF EXISTS "fanfic_likes_insert" ON fanfic_likes;
DROP POLICY IF EXISTS "fanfic_likes_delete" ON fanfic_likes;

CREATE POLICY "fanfic_likes_select" ON fanfic_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "fanfic_likes_insert" ON fanfic_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fanfic_likes_delete" ON fanfic_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);