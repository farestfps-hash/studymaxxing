-- Public profile toggle, school name, and richer leaderboard RPCs.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_profile_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS school_name text;

UPDATE public.profiles
SET is_profile_public = portfolio_public
WHERE portfolio_public IS NOT NULL;

UPDATE public.profiles
SET school_name = high_school
WHERE school_name IS NULL AND high_school IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_profile_visibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.school_name IS NULL AND NEW.high_school IS NOT NULL THEN
    NEW.school_name := NEW.high_school;
  ELSIF NEW.high_school IS NULL AND NEW.school_name IS NOT NULL THEN
    NEW.high_school := NEW.school_name;
  END IF;
  NEW.portfolio_public := NEW.is_profile_public;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_visibility ON public.profiles;
CREATE TRIGGER profiles_sync_visibility
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_visibility();

CREATE OR REPLACE FUNCTION public.leaderboard_pool(_country text)
RETURNS TABLE (
  user_id uuid,
  is_public boolean,
  full_name text,
  school_name text,
  grade_level text,
  holistic_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.is_profile_public,
    COALESCE(NULLIF(btrim(p.full_name), ''), 'Без имени'),
    COALESCE(p.school_name, p.high_school),
    p.grade_level,
    e.holistic_score
  FROM public.profiles p
  JOIN LATERAL (
    SELECT ev.holistic_score
    FROM public.ai_evaluations ev
    WHERE ev.user_id = p.id AND ev.holistic_score IS NOT NULL
    ORDER BY ev.created_at DESC
    LIMIT 1
  ) e ON true
  WHERE _country IS NULL OR _country = ANY (p.target_countries);
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_country text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  rank integer,
  is_public boolean,
  full_name text,
  school_name text,
  grade_level text,
  holistic_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    ROW_NUMBER() OVER (ORDER BY p.holistic_score DESC, p.full_name ASC)::integer AS rank,
    p.is_public,
    p.full_name,
    p.school_name,
    p.grade_level,
    p.holistic_score
  FROM public.leaderboard_pool(_country) p
  ORDER BY p.holistic_score DESC, p.full_name ASC
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard_stats(_country text DEFAULT NULL)
RETURNS TABLE (
  avg_score numeric,
  total_count bigint,
  my_rank integer,
  my_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      p.user_id,
      p.holistic_score,
      ROW_NUMBER() OVER (ORDER BY p.holistic_score DESC, p.full_name ASC)::integer AS rnk
    FROM public.leaderboard_pool(_country) p
  )
  SELECT
    ROUND(AVG(ranked.holistic_score)::numeric, 1) AS avg_score,
    COUNT(*)::bigint AS total_count,
    (SELECT r.rnk FROM ranked r WHERE r.user_id = auth.uid()) AS my_rank,
    (SELECT r.holistic_score FROM ranked r WHERE r.user_id = auth.uid()) AS my_score
  FROM ranked;
$$;

CREATE OR REPLACE FUNCTION public.get_public_portfolio(_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  school_name text,
  grade_level text,
  target_major text,
  bio text,
  gpa_unweighted numeric,
  sat_score integer,
  act_score integer,
  unt_score integer,
  nuet_score integer,
  target_countries text[],
  holistic_score integer,
  summary text,
  strengths jsonb,
  ap_exams jsonb,
  honors jsonb,
  extracurriculars jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vis boolean;
BEGIN
  SELECT p.is_profile_public INTO vis
  FROM public.profiles p
  WHERE p.id = _user_id;

  IF vis IS NULL THEN
    RETURN;
  END IF;

  IF vis IS NOT TRUE AND auth.uid() IS DISTINCT FROM _user_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(NULLIF(btrim(p.full_name), ''), 'Без имени'),
    COALESCE(p.school_name, p.high_school),
    p.grade_level,
    p.target_major,
    p.bio,
    p.gpa_unweighted,
    p.sat_score,
    p.act_score,
    p.unt_score,
    p.nuet_score,
    p.target_countries,
    e.holistic_score,
    e.summary,
    COALESCE(e.strengths, '[]'::jsonb),
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'subject', a.subject,
        'score', a.score,
        'year', a.year,
        'status', a.status
      ) ORDER BY a.created_at)
      FROM public.ap_exams a
      WHERE a.user_id = p.id
    ), '[]'::jsonb),
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', h.name,
        'year', h.year,
        'level', h.level,
        'placement', h.placement,
        'subject', h.subject
      ) ORDER BY h.created_at)
      FROM public.olympiads_honors h
      WHERE h.user_id = p.id
    ), '[]'::jsonb),
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'title', x.title,
        'organization', x.organization,
        'role', x.role,
        'years_active', x.years_active,
        'hours_per_week', x.hours_per_week,
        'description', x.description,
        'key_impact', x.key_impact
      ) ORDER BY x.created_at)
      FROM public.extracurriculars x
      WHERE x.user_id = p.id
    ), '[]'::jsonb)
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT ev.holistic_score, ev.summary, ev.strengths
    FROM public.ai_evaluations ev
    WHERE ev.user_id = p.id
    ORDER BY ev.created_at DESC
    LIMIT 1
  ) e ON true
  WHERE p.id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.leaderboard_pool(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_pool(text) TO service_role;

REVOKE ALL ON FUNCTION public.get_leaderboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_leaderboard_stats(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_stats(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_public_portfolio(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_portfolio(uuid) TO authenticated;
