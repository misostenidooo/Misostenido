/* ================================================================
   SECCIÓN 6 - MÓDULO EVENTOS (Actividades y Conciertos)
   ================================================================ */

CREATE OR ALTER PROCEDURE [dbo].[sp_Evento_Crear]
	@id_organizador INT,
	@titulo NVARCHAR(150),
	@descripcion NVARCHAR(1000) = NULL,
	@tipo_evento NVARCHAR(50) = NULL,
	@fecha_evento DATETIME,
	@ubicacion NVARCHAR(100) = NULL,
	@info_inscripcion NVARCHAR(500) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		INSERT INTO dbo.Evento (id_organizador, titulo, descripcion, tipo_evento, fecha_evento, ubicacion, info_inscripcion, fecha_publicacion)
		VALUES (@id_organizador, @titulo, @descripcion, @tipo_evento, @fecha_evento, @ubicacion, @info_inscripcion, GETDATE());

		DECLARE @id_evento INT = SCOPE_IDENTITY();

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_organizador, 'CREAR_EVENTO', 'Evento', @id_evento, CONCAT('Evento: ', @titulo), GETDATE());

		SELECT @id_evento AS id_evento, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_evento, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Evento_Actualizar]
	@id_evento INT,
	@id_organizador INT,
	@titulo NVARCHAR(150),
	@descripcion NVARCHAR(1000) = NULL,
	@tipo_evento NVARCHAR(50) = NULL,
	@fecha_evento DATETIME,
	@ubicacion NVARCHAR(100) = NULL,
	@info_inscripcion NVARCHAR(500) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF NOT EXISTS (SELECT 1 FROM dbo.Evento WHERE id_evento = @id_evento AND id_organizador = @id_organizador)
		BEGIN
			SELECT 'ERROR: El evento no existe o no le pertenece' AS mensaje;
			RETURN;
		END

		UPDATE dbo.Evento
		SET titulo = @titulo,
			descripcion = @descripcion,
			tipo_evento = @tipo_evento,
			fecha_evento = @fecha_evento,
			ubicacion = @ubicacion,
			info_inscripcion = @info_inscripcion
		WHERE id_evento = @id_evento;

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Evento_Eliminar]
	@id_evento INT,
	@id_organizador INT
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		DECLARE @es_admin BIT = 0;
		SELECT @es_admin = CASE WHEN r.nombre IN ('ADMIN', 'MODERADOR') THEN 1 ELSE 0 END
		FROM dbo.Usuario u INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol WHERE u.id_usuario = @id_organizador;

		IF NOT EXISTS (SELECT 1 FROM dbo.Evento WHERE id_evento = @id_evento AND (id_organizador = @id_organizador OR @es_admin = 1))
		BEGIN
			SELECT 'ERROR: Evento no encontrado o permiso denegado' AS mensaje;
			RETURN;
		END

		BEGIN TRANSACTION;
			DELETE FROM dbo.EventoMultimedia WHERE id_evento = @id_evento;
			DELETE FROM dbo.Evento WHERE id_evento = @id_evento;
		COMMIT TRANSACTION;

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Evento_ObtenerEventos]
	@busqueda NVARCHAR(100) = NULL,
	@tipo_evento NVARCHAR(50) = NULL,
	@ubicacion NVARCHAR(100) = NULL,
	@solo_proximos BIT = 1,
	@pagina INT = 1,
	@tamano_pagina INT = 10
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @offset INT = (@pagina - 1) * @tamano_pagina;

	SELECT 
		e.id_evento, e.titulo, e.descripcion, e.tipo_evento, e.fecha_evento, e.ubicacion, e.info_inscripcion, e.fecha_publicacion,
		u.id_usuario AS organizador_id, u.nombre AS organizador_nombre, u.tipo_perfil AS organizador_tipo, u.foto_perfil_url,
		(SELECT COUNT(1) FROM dbo.EventoMultimedia em WHERE em.id_evento = e.id_evento) AS total_media
	FROM dbo.Evento e
	INNER JOIN dbo.Usuario u ON u.id_usuario = e.id_organizador
	WHERE u.estado = 1
		AND (@solo_proximos = 0 OR e.fecha_evento >= GETDATE())
		AND (@tipo_evento IS NULL OR e.tipo_evento = @tipo_evento)
		AND (@ubicacion IS NULL OR e.ubicacion LIKE '%' + @ubicacion + '%')
		AND (@busqueda IS NULL OR e.titulo LIKE '%' + @busqueda + '%' OR e.descripcion LIKE '%' + @busqueda + '%')
	ORDER BY e.fecha_evento ASC
	OFFSET @offset ROWS FETCH NEXT @tamano_pagina ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Evento_ObtenerDetalle]
	@id_evento INT
AS
BEGIN
	SET NOCOUNT ON;

	-- Detalle del Evento
	SELECT 
		e.id_evento, e.titulo, e.descripcion, e.tipo_evento, e.fecha_evento, e.ubicacion, e.info_inscripcion, e.fecha_publicacion,
		u.id_usuario AS organizador_id, u.nombre AS organizador_nombre, u.email AS organizador_email, u.foto_perfil_url, u.tipo_perfil AS organizador_tipo
	FROM dbo.Evento e
	INNER JOIN dbo.Usuario u ON u.id_usuario = e.id_organizador
	WHERE e.id_evento = @id_evento;

	-- Media adjunta al Evento
	SELECT id_eventomultimedia, id_evento, tipo, url, descripcion, fecha_subida
	FROM dbo.EventoMultimedia
	WHERE id_evento = @id_evento;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Evento_AgregarMedia]
	@id_evento INT,
	@tipo NVARCHAR(10),
	@url NVARCHAR(300),
	@descripcion NVARCHAR(255) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF @tipo NOT IN ('FOTO', 'VIDEO')
		BEGIN
			SELECT -1 AS id_eventomultimedia, 'Tipo multimedia inválido para eventos (Solo FOTO o VIDEO)' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.EventoMultimedia (id_evento, tipo, url, descripcion, fecha_subida)
		VALUES (@id_evento, @tipo, @url, @descripcion, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_eventomultimedia, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_eventomultimedia, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Evento_EliminarMedia]
	@id_eventomultimedia INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	IF NOT EXISTS (
		SELECT 1 FROM dbo.EventoMultimedia em
		INNER JOIN dbo.Evento e ON e.id_evento = em.id_evento
		WHERE em.id_eventomultimedia = @id_eventomultimedia AND e.id_organizador = @id_usuario
	)
	BEGIN
		SELECT 'ERROR: El elemento multimedia no existe o no le pertenece' AS mensaje;
		RETURN;
	END

	DELETE FROM dbo.EventoMultimedia WHERE id_eventomultimedia = @id_eventomultimedia;
	SELECT 'OK' AS mensaje;
END
GO
