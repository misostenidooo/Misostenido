USE [MisostenidoDB];
GO

-- ============================================================
-- 1. Tabla MensajeContratacion
--    contenido en lugar de mensaje, archivo_url en lugar de metadata_json
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MensajeContratacion')
BEGIN
    CREATE TABLE dbo.MensajeContratacion (
        id_mensaje          INT IDENTITY(1,1) PRIMARY KEY,
        id_postulacion      INT NOT NULL,
        id_usuario_emisor   INT NOT NULL,
        contenido           NVARCHAR(MAX) NOT NULL,
        tipo_mensaje        VARCHAR(20)   NOT NULL DEFAULT 'TEXTO',
        archivo_url         NVARCHAR(500) NULL,
        fecha_envio         DATETIME      NOT NULL DEFAULT GETDATE(),
        leido               BIT           NOT NULL DEFAULT 0,
        CONSTRAINT FK_MensajeContratacion_Postulacion FOREIGN KEY (id_postulacion)    REFERENCES dbo.Postulacion(id_postulacion) ON DELETE CASCADE,
        CONSTRAINT FK_MensajeContratacion_Usuario     FOREIGN KEY (id_usuario_emisor) REFERENCES dbo.Usuario(id_usuario)
    );
END
ELSE
BEGIN
    -- Migrar columna "mensaje" -> "contenido" si ya existía con nombre antiguo
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MensajeContratacion') AND name = 'mensaje')
        EXEC sp_rename 'dbo.MensajeContratacion.mensaje', 'contenido', 'COLUMN';
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MensajeContratacion') AND name = 'archivo_url')
        ALTER TABLE dbo.MensajeContratacion ADD archivo_url NVARCHAR(500) NULL;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MensajeContratacion') AND name = 'metadata_json')
        ALTER TABLE dbo.MensajeContratacion DROP COLUMN metadata_json;
END
GO

-- ============================================================
-- 2. Tabla AcuerdoContratacion
--    Esquema nuevo con firmas digitales, clausulas, honorarios
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AcuerdoContratacion')
BEGIN
    CREATE TABLE dbo.AcuerdoContratacion (
        id_acuerdo                  INT IDENTITY(1,1) PRIMARY KEY,
        id_postulacion              INT            NOT NULL UNIQUE,
        honorarios_acordados        DECIMAL(12,2)  NULL,
        fecha_compromiso            DATETIME       NULL,
        clausulas_especiales        NVARCHAR(MAX)  NULL,
        firma_digital_contratante   NVARCHAR(500)  NULL,
        fecha_firma_contratante     DATETIME       NULL,
        firma_digital_artista       NVARCHAR(500)  NULL,
        fecha_firma_artista         DATETIME       NULL,
        estado_acuerdo              VARCHAR(30)    NOT NULL DEFAULT 'BORRADOR',
        fecha_creacion              DATETIME       NOT NULL DEFAULT GETDATE(),
        fecha_actualizacion         DATETIME       NULL,
        CONSTRAINT FK_AcuerdoContratacion_Postulacion FOREIGN KEY (id_postulacion) REFERENCES dbo.Postulacion(id_postulacion) ON DELETE CASCADE
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'honorarios_acordados')
        ALTER TABLE dbo.AcuerdoContratacion ADD honorarios_acordados DECIMAL(12,2) NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'fecha_compromiso')
        ALTER TABLE dbo.AcuerdoContratacion ADD fecha_compromiso DATETIME NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'clausulas_especiales')
        ALTER TABLE dbo.AcuerdoContratacion ADD clausulas_especiales NVARCHAR(MAX) NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'firma_digital_contratante')
        ALTER TABLE dbo.AcuerdoContratacion ADD firma_digital_contratante NVARCHAR(500) NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'fecha_firma_contratante')
        ALTER TABLE dbo.AcuerdoContratacion ADD fecha_firma_contratante DATETIME NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'firma_digital_artista')
        ALTER TABLE dbo.AcuerdoContratacion ADD firma_digital_artista NVARCHAR(500) NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'fecha_firma_artista')
        ALTER TABLE dbo.AcuerdoContratacion ADD fecha_firma_artista DATETIME NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'estado_acuerdo')
        ALTER TABLE dbo.AcuerdoContratacion ADD estado_acuerdo VARCHAR(30) NOT NULL DEFAULT 'BORRADOR';
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'fecha_creacion')
        ALTER TABLE dbo.AcuerdoContratacion ADD fecha_creacion DATETIME NOT NULL DEFAULT GETDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.AcuerdoContratacion') AND name = 'fecha_actualizacion')
        ALTER TABLE dbo.AcuerdoContratacion ADD fecha_actualizacion DATETIME NULL;
END
GO

-- ============================================================
-- 3. sp_Contratacion_EnviarMensaje
--    @id_usuario_emisor, @contenido, @archivo_url  <-- coincide con C#
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_Contratacion_EnviarMensaje
    @id_postulacion    INT,
    @id_usuario_emisor INT,
    @contenido         NVARCHAR(MAX),
    @tipo_mensaje      VARCHAR(20)   = 'TEXTO',
    @archivo_url       NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Postulacion WHERE id_postulacion = @id_postulacion)
    BEGIN
        SELECT -1 AS id_mensaje, 'La postulación no existe' AS mensaje;
        RETURN;
    END

    INSERT INTO dbo.MensajeContratacion (
        id_postulacion, id_usuario_emisor, contenido,
        tipo_mensaje, archivo_url, fecha_envio, leido
    )
    VALUES (
        @id_postulacion, @id_usuario_emisor, @contenido,
        ISNULL(@tipo_mensaje, 'TEXTO'), @archivo_url, GETDATE(), 0
    );

    DECLARE @newId INT = SCOPE_IDENTITY();
    SELECT @newId AS id_mensaje, 'OK' AS mensaje;
END
GO

-- ============================================================
-- 4. sp_Contratacion_ObtenerMensajes
--    Devuelve: contenido, archivo_url, emisor_rol  <-- coincide con C#
--    Parámetros: @id_postulacion, @id_usuario_lector (para marcar leído)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_Contratacion_ObtenerMensajes
    @id_postulacion    INT,
    @id_usuario_lector INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @id_usuario_lector IS NOT NULL
    BEGIN
        UPDATE dbo.MensajeContratacion
        SET leido = 1
        WHERE id_postulacion = @id_postulacion
          AND id_usuario_emisor <> @id_usuario_lector
          AND leido = 0;
    END

    SELECT
        m.id_mensaje,
        m.id_postulacion,
        m.id_usuario_emisor,
        u.nombre          AS emisor_nombre,
        u.foto_perfil_url AS emisor_foto,
        ISNULL(r.nombre, 'USUARIO') AS emisor_rol,
        m.contenido,
        m.tipo_mensaje,
        m.archivo_url,
        m.fecha_envio,
        m.leido
    FROM dbo.MensajeContratacion m
    INNER JOIN dbo.Usuario u ON u.id_usuario = m.id_usuario_emisor
    LEFT  JOIN dbo.Rol     r ON r.id_rol     = u.id_rol
    WHERE m.id_postulacion = @id_postulacion
    ORDER BY m.fecha_envio ASC, m.id_mensaje ASC;
END
GO

-- ============================================================
-- 5. sp_Contratacion_GuardarAcuerdo
--    Parámetros: @id_usuario_actor, @honorarios_acordados, @fecha_compromiso,
--    @clausulas_especiales, @firma_digital_contratante, @firma_digital_artista, @estado_acuerdo
--    Devuelve: mensaje ('OK' o error)  <-- coincide con C#
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_Contratacion_GuardarAcuerdo
    @id_postulacion            INT,
    @id_usuario_actor          INT,
    @honorarios_acordados      DECIMAL(12,2)  = NULL,
    @fecha_compromiso          DATETIME       = NULL,
    @clausulas_especiales      NVARCHAR(MAX)  = NULL,
    @firma_digital_contratante NVARCHAR(500)  = NULL,
    @firma_digital_artista     NVARCHAR(500)  = NULL,
    @estado_acuerdo            VARCHAR(30)    = 'BORRADOR'
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Postulacion WHERE id_postulacion = @id_postulacion)
    BEGIN
        SELECT 'La postulación no existe' AS mensaje;
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.AcuerdoContratacion WHERE id_postulacion = @id_postulacion)
    BEGIN
        INSERT INTO dbo.AcuerdoContratacion (
            id_postulacion, honorarios_acordados, fecha_compromiso, clausulas_especiales,
            firma_digital_contratante, fecha_firma_contratante,
            firma_digital_artista, fecha_firma_artista,
            estado_acuerdo, fecha_creacion, fecha_actualizacion
        )
        VALUES (
            @id_postulacion, @honorarios_acordados, @fecha_compromiso, @clausulas_especiales,
            @firma_digital_contratante, CASE WHEN @firma_digital_contratante IS NOT NULL THEN GETDATE() ELSE NULL END,
            @firma_digital_artista, CASE WHEN @firma_digital_artista IS NOT NULL THEN GETDATE() ELSE NULL END,
            ISNULL(@estado_acuerdo, 'BORRADOR'), GETDATE(), GETDATE()
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.AcuerdoContratacion SET
            honorarios_acordados      = ISNULL(@honorarios_acordados,     honorarios_acordados),
            fecha_compromiso          = ISNULL(@fecha_compromiso,          fecha_compromiso),
            clausulas_especiales      = ISNULL(@clausulas_especiales,      clausulas_especiales),
            firma_digital_contratante = ISNULL(@firma_digital_contratante, firma_digital_contratante),
            fecha_firma_contratante   = CASE WHEN @firma_digital_contratante IS NOT NULL AND fecha_firma_contratante IS NULL THEN GETDATE() ELSE fecha_firma_contratante END,
            firma_digital_artista     = ISNULL(@firma_digital_artista,     firma_digital_artista),
            fecha_firma_artista       = CASE WHEN @firma_digital_artista IS NOT NULL AND fecha_firma_artista IS NULL THEN GETDATE() ELSE fecha_firma_artista END,
            estado_acuerdo            = ISNULL(@estado_acuerdo,            estado_acuerdo),
            fecha_actualizacion       = GETDATE()
        WHERE id_postulacion = @id_postulacion;
    END

    SELECT 'OK' AS mensaje;
END
GO

-- ============================================================
-- 6. sp_Contratacion_ObtenerAcuerdo
--    Devuelve columnas que lee C#: honorarios_acordados, clausulas_especiales,
--    firma_digital_contratante, fecha_firma_contratante, firma_digital_artista,
--    fecha_firma_artista, estado_acuerdo, fecha_creacion, fecha_actualizacion
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_Contratacion_ObtenerAcuerdo
    @id_postulacion    INT,
    @id_usuario_lector INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_acuerdo,
        id_postulacion,
        honorarios_acordados,
        fecha_compromiso,
        clausulas_especiales,
        firma_digital_contratante,
        fecha_firma_contratante,
        firma_digital_artista,
        fecha_firma_artista,
        estado_acuerdo,
        fecha_creacion,
        fecha_actualizacion
    FROM dbo.AcuerdoContratacion
    WHERE id_postulacion = @id_postulacion;
END
GO


-- 1. Tabla MensajeContratacion
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MensajeContratacion')
BEGIN
    CREATE TABLE dbo.MensajeContratacion (
        id_mensaje INT IDENTITY(1,1) PRIMARY KEY,
        id_postulacion INT NOT NULL,
        id_usuario_emisor INT NOT NULL,
        mensaje NVARCHAR(MAX) NOT NULL,
        tipo_mensaje VARCHAR(20) NOT NULL DEFAULT 'TEXTO', -- 'TEXTO', 'ACUERDO', 'SISTEMA'
        metadata_json NVARCHAR(MAX) NULL,
        fecha_envio DATETIME NOT NULL DEFAULT GETDATE(),
        leido BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_MensajeContratacion_Postulacion FOREIGN KEY (id_postulacion) REFERENCES dbo.Postulacion(id_postulacion) ON DELETE CASCADE,
        CONSTRAINT FK_MensajeContratacion_Usuario FOREIGN KEY (id_usuario_emisor) REFERENCES dbo.Usuario(id_usuario)
    );
END
GO

-- 2. Tabla AcuerdoContratacion
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AcuerdoContratacion')
BEGIN
    CREATE TABLE dbo.AcuerdoContratacion (
        id_acuerdo INT IDENTITY(1,1) PRIMARY KEY,
        id_postulacion INT NOT NULL UNIQUE,
        tarifa_acordada DECIMAL(10,2) NULL,
        duracion_show NVARCHAR(100) NULL,
        fecha_evento DATETIME NULL,
        ubicacion_evento NVARCHAR(200) NULL,
        sonido_incluido BIT NOT NULL DEFAULT 1,
        transporte_incluido BIT NOT NULL DEFAULT 1,
        anticipo_pactado BIT NOT NULL DEFAULT 1,
        firmado_contratante BIT NOT NULL DEFAULT 0,
        firmado_artista BIT NOT NULL DEFAULT 0,
        fecha_actualizacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_AcuerdoContratacion_Postulacion FOREIGN KEY (id_postulacion) REFERENCES dbo.Postulacion(id_postulacion) ON DELETE CASCADE
    );
END
GO

-- 3. Procedimiento para Enviar Mensaje
CREATE OR ALTER PROCEDURE dbo.sp_Contratacion_EnviarMensaje
    @id_postulacion INT,
    @id_usuario INT,
    @mensaje NVARCHAR(MAX),
    @tipo_mensaje VARCHAR(20) = 'TEXTO',
    @metadata_json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar que la postulación exista
    IF NOT EXISTS (SELECT 1 FROM dbo.Postulacion WHERE id_postulacion = @id_postulacion)
    BEGIN
        SELECT -1 AS id_mensaje, 'La postulación no existe' AS mensaje;
        RETURN;
    END

    INSERT INTO dbo.MensajeContratacion (
        id_postulacion,
        id_usuario_emisor,
        mensaje,
        tipo_mensaje,
        metadata_json,
        fecha_envio,
        leido
    )
    VALUES (
        @id_postulacion,
        @id_usuario,
        @mensaje,
        ISNULL(@tipo_mensaje, 'TEXTO'),
        @metadata_json,
        GETDATE(),
        0
    );

    DECLARE @newId INT = SCOPE_IDENTITY();
    SELECT @newId AS id_mensaje, 'OK' AS mensaje;
END
GO

-- 4. Procedimiento para Obtener Mensajes
CREATE OR ALTER PROCEDURE dbo.sp_Contratacion_ObtenerMensajes
    @id_postulacion INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        m.id_mensaje,
        m.id_postulacion,
        m.id_usuario_emisor,
        u.nombre AS emisor_nombre,
        u.foto_perfil_url AS emisor_foto,
        ISNULL(r.nombre, 'USUARIO') AS emisor_rol,
        m.mensaje,
        m.tipo_mensaje,
        m.metadata_json,
        m.fecha_envio,
        m.leido
    FROM dbo.MensajeContratacion m
    INNER JOIN dbo.Usuario u ON u.id_usuario = m.id_usuario_emisor
    LEFT JOIN dbo.Rol r ON r.id_rol = u.id_rol
    WHERE m.id_postulacion = @id_postulacion
    ORDER BY m.fecha_envio ASC, m.id_mensaje ASC;
END
GO

-- 5. Procedimiento para Guardar Acuerdo
CREATE OR ALTER PROCEDURE dbo.sp_Contratacion_GuardarAcuerdo
    @id_postulacion INT,
    @id_usuario INT,
    @tarifa_acordada DECIMAL(10,2) = NULL,
    @duracion_show NVARCHAR(100) = NULL,
    @fecha_evento DATETIME = NULL,
    @ubicacion_evento NVARCHAR(200) = NULL,
    @sonido_incluido BIT = 1,
    @transporte_incluido BIT = 1,
    @anticipo_pactado BIT = 1,
    @firmar BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Postulacion WHERE id_postulacion = @id_postulacion)
    BEGIN
        SELECT -1 AS id_acuerdo, 'La postulación no existe' AS mensaje;
        RETURN;
    END

    -- Upsert
    IF NOT EXISTS (SELECT 1 FROM dbo.AcuerdoContratacion WHERE id_postulacion = @id_postulacion)
    BEGIN
        INSERT INTO dbo.AcuerdoContratacion (
            id_postulacion,
            tarifa_acordada,
            duracion_show,
            fecha_evento,
            ubicacion_evento,
            sonido_incluido,
            transporte_incluido,
            anticipo_pactado,
            firmado_contratante,
            firmado_artista,
            fecha_actualizacion
        )
        VALUES (
            @id_postulacion,
            @tarifa_acordada,
            @duracion_show,
            @fecha_evento,
            @ubicacion_evento,
            @sonido_incluido,
            @transporte_incluido,
            @anticipo_pactado,
            CASE WHEN @firmar = 1 THEN 1 ELSE 0 END,
            CASE WHEN @firmar = 1 THEN 1 ELSE 0 END,
            GETDATE()
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.AcuerdoContratacion
        SET 
            tarifa_acordada = ISNULL(@tarifa_acordada, tarifa_acordada),
            duracion_show = ISNULL(@duracion_show, duracion_show),
            fecha_evento = ISNULL(@fecha_evento, fecha_evento),
            ubicacion_evento = ISNULL(@ubicacion_evento, ubicacion_evento),
            sonido_incluido = @sonido_incluido,
            transporte_incluido = @transporte_incluido,
            anticipo_pactado = @anticipo_pactado,
            firmado_contratante = CASE WHEN @firmar = 1 THEN 1 ELSE firmado_contratante END,
            firmado_artista = CASE WHEN @firmar = 1 THEN 1 ELSE firmado_artista END,
            fecha_actualizacion = GETDATE()
        WHERE id_postulacion = @id_postulacion;
    END

    DECLARE @idAcuerdo INT;
    SELECT @idAcuerdo = id_acuerdo FROM dbo.AcuerdoContratacion WHERE id_postulacion = @id_postulacion;
    SELECT @idAcuerdo AS id_acuerdo, 'OK' AS mensaje;
END
GO

-- 6. Procedimiento para Obtener Acuerdo
CREATE OR ALTER PROCEDURE dbo.sp_Contratacion_ObtenerAcuerdo
    @id_postulacion INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        id_acuerdo,
        id_postulacion,
        tarifa_acordada,
        duracion_show,
        fecha_evento,
        ubicacion_evento,
        sonido_incluido,
        transporte_incluido,
        anticipo_pactado,
        firmado_contratante,
        firmado_artista,
        fecha_actualizacion
    FROM dbo.AcuerdoContratacion
    WHERE id_postulacion = @id_postulacion;
END
GO
