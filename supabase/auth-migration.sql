-- ============================================
-- Work To Do - Auth Migration
-- ============================================
-- Run this SQL AFTER running schema.sql
-- This sets up Supabase Auth integration
-- ============================================

-- ============================================
-- 1. MODIFY USERS TABLE to link with auth.users
-- ============================================
-- The users.id now references auth.users.id
-- This allows Supabase Auth to manage authentication
-- while public.users stores profile data

-- Drop existing foreign key constraints that reference users(id)
-- and recreate users table to reference auth.users

-- First, allow the id to accept auth user UUIDs
-- (The table already uses UUID, so no schema change needed)

-- ============================================
-- 2. AUTO-CREATE PROFILE ON SIGN UP
-- ============================================
-- This trigger automatically creates a public.users row
-- when a new user signs up through Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  avatar_colors TEXT[] := ARRAY['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#14b8a6'];
  random_color TEXT;
BEGIN
  random_color := avatar_colors[floor(random() * array_length(avatar_colors, 1) + 1)::int];

  INSERT INTO public.users (id, name, email, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    random_color
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, users.name),
    email = COALESCE(EXCLUDED.email, users.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. UPDATE RLS POLICIES for Auth
-- ============================================
-- Now we can use auth.uid() to check the current user

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all for users" ON users;
DROP POLICY IF EXISTS "Allow all for projects" ON projects;
DROP POLICY IF EXISTS "Allow all for project_members" ON project_members;
DROP POLICY IF EXISTS "Allow all for tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all for labels" ON labels;
DROP POLICY IF EXISTS "Allow all for task_labels" ON task_labels;
DROP POLICY IF EXISTS "Allow all for comments" ON comments;

-- Users: can read all, update own profile
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Projects: authenticated users can CRUD
CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  USING (auth.role() = 'authenticated');

-- Project members: authenticated users
CREATE POLICY "Authenticated users can manage project members"
  ON project_members FOR ALL
  USING (auth.role() = 'authenticated');

-- Tasks: authenticated users
CREATE POLICY "Authenticated users can manage tasks"
  ON tasks FOR ALL
  USING (auth.role() = 'authenticated');

-- Labels: authenticated users
CREATE POLICY "Authenticated users can manage labels"
  ON labels FOR ALL
  USING (auth.role() = 'authenticated');

-- Task labels: authenticated users
CREATE POLICY "Authenticated users can manage task labels"
  ON task_labels FOR ALL
  USING (auth.role() = 'authenticated');

-- Comments: authenticated users
CREATE POLICY "Authenticated users can manage comments"
  ON comments FOR ALL
  USING (auth.role() = 'authenticated');
