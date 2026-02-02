-- Add delivery_method column to reminder_schedules
-- Allows users to choose email, push, or both for reminders
ALTER TABLE reminder_schedules
  ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT 'email';

-- Add check constraint for valid values
ALTER TABLE reminder_schedules
  ADD CONSTRAINT reminder_schedules_delivery_method_check
  CHECK (delivery_method IN ('email', 'push', 'both'));
