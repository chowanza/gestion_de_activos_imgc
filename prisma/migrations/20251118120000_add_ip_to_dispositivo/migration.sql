-- Add optional IP field to Dispositivo on SQL Server (idempotent)
IF COL_LENGTH('dbo.Dispositivo', 'ip') IS NULL
BEGIN
    ALTER TABLE [dbo].[Dispositivo] ADD [ip] NVARCHAR(1000) NULL;
END
