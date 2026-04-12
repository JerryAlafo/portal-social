-- Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_history_select ON chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY chat_history_insert ON chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY chat_history_delete ON chat_history FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_chat_history_user ON chat_history(user_id);
CREATE INDEX idx_chat_history_created ON chat_history(created_at);

NOTIFY pgrst, 'reload';
