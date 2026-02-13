-- =============================================================================
-- PRD 49: Fix missing RLS on badges and coaching_themes tables
-- Both are admin-managed reference data: public read, service_role write
-- =============================================================================

-- ==================== BADGES ====================
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage badges" ON badges
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ==================== COACHING THEMES ====================
ALTER TABLE coaching_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coaching themes" ON coaching_themes
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage coaching themes" ON coaching_themes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
