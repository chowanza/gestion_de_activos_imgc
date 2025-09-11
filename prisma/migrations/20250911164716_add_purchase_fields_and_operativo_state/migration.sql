/*
  Warnings:

  - You are about to drop the column `nsap` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `nsap` on the `Dispositivo` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Computador] DROP COLUMN [nsap];
ALTER TABLE [dbo].[Computador] ADD [codigoImgc] NVARCHAR(1000),
[fechaCompra] DATETIME2,
[monto] DECIMAL(32,16),
[numeroFactura] NVARCHAR(1000),
[proveedor] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Dispositivo] DROP COLUMN [nsap];
ALTER TABLE [dbo].[Dispositivo] ADD [codigoImgc] NVARCHAR(1000),
[fechaCompra] DATETIME2,
[monto] DECIMAL(32,16),
[numeroFactura] NVARCHAR(1000),
[proveedor] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
