-- Fix migration: add email column (if missing) and unique constraint on User.email
-- Safe idempotent script for SQL Server. Wraps changes in a transaction and checks existence before altering.
-- IMPORTANT: Make a backup of the database before running.

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
  -- We check sys.indexes for an index with the expected name on the User table.
  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes i
    WHERE i.name = 'UQ_User_email' AND i.object_id = OBJECT_ID('dbo.[User]')
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

  RAISERROR('Migration fix failed: %s', @ErrorSeverity, @ErrorState, @ErrorMessage);
END CATCH;
