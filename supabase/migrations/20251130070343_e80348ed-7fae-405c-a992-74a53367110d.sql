-- Create user profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create user_usage table for tracking API calls
create table public.user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  function_name text not null,
  tokens_used integer default 0,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on user_usage
alter table public.user_usage enable row level security;

-- Policies for user_usage
create policy "Users can view their own usage"
  on public.user_usage for select
  using (auth.uid() = user_id);

create policy "Service role can insert usage"
  on public.user_usage for insert
  with check (true);

-- Function to automatically create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to check daily usage limits
create function public.check_user_quota(p_user_id uuid, p_daily_limit integer default 100)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  daily_usage integer;
begin
  select count(*)
  into daily_usage
  from public.user_usage
  where user_id = p_user_id
    and created_at >= current_date;
  
  return daily_usage < p_daily_limit;
end;
$$;