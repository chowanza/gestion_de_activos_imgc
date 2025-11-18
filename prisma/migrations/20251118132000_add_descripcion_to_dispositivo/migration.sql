-- Add optional descripcion field to Dispositivo (SQL Server)
IF COL_LENGTH('dbo.Dispositivo', 'descripcion') IS NULL
BEGIN
    ALTER TABLE [dbo].[Dispositivo] ADD [descripcion] NVARCHAR(1000) NULL;
END
