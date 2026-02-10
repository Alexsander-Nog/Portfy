-- Migration: Add translations support to profiles table
-- Run this in Supabase SQL Editor if your database already exists

-- Add translations column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb;

-- Add translations column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb;

-- Add translations column to experiences table
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.translations IS 'Stores translations for bio, title, and other fields. Format: {"en": {"bio": "...", "title": "..."}, "es": {...}}';
COMMENT ON COLUMN public.projects.translations IS 'Stores translations for title, description, category. Format: {"en": {"title": "...", "description": "...", "category": "..."}, "es": {...}}';
COMMENT ON COLUMN public.experiences.translations IS 'Stores translations for title, company, description. Format: {"en": {"title": "...", "company": "...", "description": "..."}, "es": {...}}';
