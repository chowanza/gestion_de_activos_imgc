/*
  Warnings:

  - You are about to drop the column `lineaTelefonicaId` on the `Asignaciones` table. All the data in the column will be lost.
  - You are about to drop the `LineaTelefonica` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_lineaTelefonicaId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Asignaciones] DROP COLUMN [lineaTelefonicaId];

-- DropTable
DROP TABLE [dbo].[LineaTelefonica];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
