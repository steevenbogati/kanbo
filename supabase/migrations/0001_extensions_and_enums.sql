-- 0001 — Extensions and enum types
-- Stored values are in English; the UI translates them to Spanish.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('backlog', 'in_progress', 'in_review', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recurrence_kind as enum ('none', 'daily', 'weekly', 'monthly');
exception when duplicate_object then null; end $$;
