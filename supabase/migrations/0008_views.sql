-- 0008 — Read-only views for the list view and the admin dashboard.
-- security_invoker = true makes the views respect the caller's RLS policies,
-- instead of running with the owner's privileges.

-- The later workspace migration adds columns to this view. Dropping it first
-- keeps the complete migration bundle safe to run again.
drop view if exists public.v_task_overview;

create view public.v_task_overview
with (security_invoker = true) as
select
  t.id,
  t.title,
  t.description,
  t.assignee_id,
  a.full_name  as assignee_name,
  t.project_id,
  p.name       as project_name,
  p.client_name,
  t.priority,
  t.status,
  t.due_date,
  t.external_url,
  t.board_position,
  t.recurrence,
  t.started_at,
  t.completed_at,
  t.duration_days,
  t.created_by,
  c.full_name  as created_by_name,
  t.created_at,
  t.updated_at,
  (t.status <> 'done' and t.due_date is not null and t.due_date < current_date) as is_overdue,
  (t.status <> 'done' and t.due_date = current_date) as is_due_today
from public.tasks t
left join public.profiles a on a.id = t.assignee_id
left join public.profiles c on c.id = t.created_by
left join public.projects p on p.id = t.project_id;

drop view if exists public.v_workload_by_person;

create view public.v_workload_by_person
with (security_invoker = true) as
select
  pr.id                                    as profile_id,
  pr.full_name,
  pr.email,
  pr.role,
  count(t.id) filter (where t.status <> 'done')                                          as open_tasks,
  count(t.id) filter (where t.status = 'in_progress')                                    as in_progress_tasks,
  count(t.id) filter (
    where t.status <> 'done' and t.due_date is not null and t.due_date < current_date
  )                                                                                       as overdue_tasks,
  count(t.id) filter (
    where t.status = 'done' and t.completed_at >= (current_date - interval '7 days')
  )                                                                                       as done_last_7_days,
  round(avg(t.duration_days) filter (where t.status = 'done'), 2)                          as avg_duration_days
from public.profiles pr
left join public.tasks t on t.assignee_id = pr.id
where pr.is_active
group by pr.id, pr.full_name, pr.email, pr.role;
