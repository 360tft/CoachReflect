-- Backfill existing drills with sport='football' (all drills created before multi-sport support)
UPDATE saved_drills
SET drill_data = jsonb_set(drill_data, '{sport}', '"football"')
WHERE drill_data->>'sport' IS NULL;

UPDATE generated_drills
SET drill_data = jsonb_set(drill_data, '{sport}', '"football"')
WHERE drill_data->>'sport' IS NULL;
