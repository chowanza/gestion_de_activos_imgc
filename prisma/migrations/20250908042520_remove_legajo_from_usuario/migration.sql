/*
  Warnings:

  - You are about to drop the column `legajo` on the `Usuario` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_role_df];
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_role_df] DEFAULT 'viewer' FOR [role];

-- AlterTable
ALTER TABLE [dbo].[Usuario] DROP COLUMN [legajo];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
