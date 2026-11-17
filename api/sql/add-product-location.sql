IF COL_LENGTH('dbo.Products', 'latitud') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD latitud DECIMAL(9, 6) NULL;
END;

IF COL_LENGTH('dbo.Products', 'longitud') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD longitud DECIMAL(9, 6) NULL;
END;
