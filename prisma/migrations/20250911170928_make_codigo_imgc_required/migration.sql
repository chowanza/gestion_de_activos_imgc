/*
  Warnings:

  - Made the column `codigoImgc` on table `Computador` required. This step will fail if there are existing NULL values in that column.
  - Made the column `codigoImgc` on table `Dispositivo` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- Update NULL values first
UPDATE [dbo].[Computador] SET [codigoImgc] = 'SIN_CODIGO' WHERE [codigoImgc] IS NULL;
UPDATE [dbo].[Dispositivo] SET [codigoImgc] = 'SIN_CODIGO' WHERE [codigoImgc] IS NULL;

-- AlterTable
ALTER TABLE [dbo].[Computador] ALTER COLUMN [codigoImgc] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Dispositivo] ALTER COLUMN [codigoImgc] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
