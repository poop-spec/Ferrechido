CREATE TABLE dbo.Products (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Products_id DEFAULT NEWSEQUENTIALID(),
    sku NVARCHAR(40) NOT NULL,
    nombre NVARCHAR(160) NOT NULL,
    marca NVARCHAR(120) NOT NULL,
    icono NVARCHAR(16) NOT NULL,
    stock INT NOT NULL,
    precio DECIMAL(18, 2) NOT NULL,
    latitud DECIMAL(9, 6) NULL,
    longitud DECIMAL(9, 6) NULL,
    CONSTRAINT PK_Products PRIMARY KEY (id),
    CONSTRAINT UQ_Products_sku UNIQUE (sku),
    CONSTRAINT CK_Products_stock_nonnegative CHECK (stock >= 0),
    CONSTRAINT CK_Products_price_positive CHECK (precio > 0)
);
