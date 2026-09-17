ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_public boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_country text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  is_public boolean,
  full_name text,
  high_school text,
  grade_level text,
  target_major text,
  target_countries text[],
  gpa_unweighted numeric,
  sat_score integer,
  act_score integer,
  unt_score integer,
  nuet_score integer,
  holistic_score integer,
  summary text,
  countries jsonb,
  strengths jsonb,
  evaluated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.portfolio_public,
    CASE WHEN p.portfolio_public THEN p.full_name ELSE NULL END,
    CASE WHEN p.portfolio_public THEN p.high_school ELSE NULL END,
    CASE WHEN p.portfolio_public THEN p.grade_level ELSE NULL END,
    CASE WHEN p.portfolio_public THEN p.target_major ELSE NULL END,
    p.target_countries,
    CASE WHEN p.portfolio_public THEN p.gpa_unweighted ELSE NULL END,
    CASE WHEN p.portfolio_public THEN p.sat_score ELSE NULL END,
    CASE WHEN p.portfolio_public THEN p.act_score ELSE NULL END,
    CASE WHEN p.portfolio_public THEN p.unt_score ELSE NULL END,
    CASE WHEN p.portfolio_public THEN p.nuet_score ELSE NULL END,
    e.holistic_score,
    CASE WHEN p.portfolio_public THEN e.summary ELSE NULL END,
    CASE WHEN p.portfolio_public THEN e.countries ELSE '[]'::jsonb END,
    CASE WHEN p.portfolio_public THEN e.strengths ELSE '[]'::jsonb END,
    e.created_at
  FROM public.profiles p
  JOIN LATERAL (
    SELECT ev.holistic_score, ev.summary, ev.countries, ev.strengths, ev.created_at
    FROM public.ai_evaluations ev
    WHERE ev.user_id = p.id AND ev.holistic_score IS NOT NULL
    ORDER BY ev.created_at DESC
    LIMIT 1
  ) e ON true
  WHERE _country IS NULL OR _country = ANY (p.target_countries)
  ORDER BY e.holistic_score DESC NULLS LAST
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO authenticated;