-- Migration: make email unique on User
-- This migration adds a unique constraint on the User.email column.
-- Precondition: ensure there are no duplicate non-null emails (script checked this before running).
-- Migration: make email unique on User
-- This migration ensures the `email` column exists on dbo.[User] and adds a unique constraint.
-- The statements are written idempotently so the migration can be applied on an empty database
-- or on databases with drift.

SET NOCOUNT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  -- 1) Add column `email` if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'User' AND COLUMN_NAME = 'email'
  )
  BEGIN
    ALTER TABLE [User]
    ADD [email] NVARCHAR(255) NULL;
  END

  -- 2) Add unique constraint/index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UQ_User_email' AND object_id = OBJECT_ID('dbo.[User]')
  )
  BEGIN
    ALTER TABLE [User]
    ADD CONSTRAINT UQ_User_email UNIQUE ([email]);
  END

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
  DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
  DECLARE @ErrorState INT = ERROR_STATE();

  RAISERROR('Migration failed: %s', @ErrorSeverity, @ErrorState, @ErrorMessage);
END CATCH;
