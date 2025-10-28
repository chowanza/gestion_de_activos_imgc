-- Migration: make email unique on User
-- This migration adds a unique constraint on the User.email column.
-- Precondition: ensure there are no duplicate non-null emails (script checked this before running).

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UQ_User_email'
)
BEGIN
  ALTER TABLE [User]
  ADD CONSTRAINT UQ_User_email UNIQUE ([email]);
END
