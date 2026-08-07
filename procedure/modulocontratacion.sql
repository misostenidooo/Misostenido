/* ================================================================
   SECCIÓN 5 - MÓDULO CONTRATACIONES (Ofertas, Solicitudes, Postulaciones)
   ================================================================ */

-- --- Ofertas de Servicio ---

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_CrearOferta]
	@id_usuario INT,
	@titulo NVARCHAR(150),
	@descripcion NVARCHAR(1000) = NULL,
	@genero_musical NVARCHAR(80) = NULL,
	@tarifa_aproximada DECIMAL(10,2) = NULL,
	@ubicacion NVARCHAR(100) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		INSERT INTO dbo.OfertaServicio (id_usuario, titulo, descripcion, genero_musical, tarifa_aproximada, ubicacion, disponible, fecha_publicacion)
		VALUES (@id_usuario, @titulo, @descripcion, @genero_musical, @tarifa_aproximada, @ubicacion, 1, GETDATE());

		DECLARE @id_oferta INT = SCOPE_IDENTITY();

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_usuario, 'CREAR_OFERTA_SERVICIO', 'OfertaServicio', @id_oferta, CONCAT('Oferta: ', @titulo), GETDATE());

		SELECT @id_oferta AS id_ofertaservicio, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_ofertaservicio, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_ActualizarOferta]
	@id_ofertaservicio INT,
	@id_usuario INT,
	@titulo NVARCHAR(150),
	@descripcion NVARCHAR(1000) = NULL,
	@genero_musical NVARCHAR(80) = NULL,
	@tarifa_aproximada DECIMAL(10,2) = NULL,
	@ubicacion NVARCHAR(100) = NULL,
	@disponible BIT = 1
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF NOT EXISTS (SELECT 1 FROM dbo.OfertaServicio WHERE id_ofertaservicio = @id_ofertaservicio AND id_usuario = @id_usuario)
		BEGIN
			SELECT 'ERROR: La oferta no existe o no le pertenece' AS mensaje;
			RETURN;
		END

		UPDATE dbo.OfertaServicio
		SET titulo = @titulo,
			descripcion = @descripcion,
			genero_musical = @genero_musical,
			tarifa_aproximada = @tarifa_aproximada,
			ubicacion = @ubicacion,
			disponible = @disponible
		WHERE id_ofertaservicio = @id_ofertaservicio;

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_CambiarEstadoOferta]
	@id_ofertaservicio INT,
	@id_usuario INT,
	@disponible BIT
AS
BEGIN
	SET NOCOUNT ON;
	UPDATE dbo.OfertaServicio 
	SET disponible = @disponible 
	WHERE id_ofertaservicio = @id_ofertaservicio AND id_usuario = @id_usuario;

	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_EliminarOferta]
	@id_ofertaservicio INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF NOT EXISTS (SELECT 1 FROM dbo.OfertaServicio WHERE id_ofertaservicio = @id_ofertaservicio AND id_usuario = @id_usuario)
		BEGIN
			SELECT 'ERROR: Oferta no encontrada o permiso denegado' AS mensaje;
			RETURN;
		END

		BEGIN TRANSACTION;
			DELETE FROM dbo.ContratacionMultimedia WHERE id_oferta = @id_ofertaservicio;
			DELETE FROM dbo.Postulacion WHERE id_oferta = @id_ofertaservicio;
			DELETE FROM dbo.OfertaServicio WHERE id_ofertaservicio = @id_ofertaservicio;
		COMMIT TRANSACTION;

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_ObtenerOfertas]
	@busqueda NVARCHAR(100) = NULL,
	@genero_musical NVARCHAR(80) = NULL,
	@ubicacion NVARCHAR(100) = NULL,
	@tarifa_max DECIMAL(10,2) = NULL,
	@pagina INT = 1,
	@tamano_pagina INT = 10
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @offset INT = (@pagina - 1) * @tamano_pagina;

	SELECT 
		o.id_ofertaservicio, o.titulo, o.descripcion, o.genero_musical, o.tarifa_aproximada, o.ubicacion, o.disponible, o.fecha_publicacion,
		u.id_usuario AS artista_id, u.nombre AS artista_nombre, u.tipo_perfil AS artista_tipo, u.foto_perfil_url, u.verificado AS artista_verificado,
		(SELECT COUNT(1) FROM dbo.ContratacionMultimedia cm WHERE cm.id_oferta = o.id_ofertaservicio) AS total_media
	FROM dbo.OfertaServicio o
	INNER JOIN dbo.Usuario u ON u.id_usuario = o.id_usuario
	WHERE o.disponible = 1 AND u.estado = 1
		AND (@genero_musical IS NULL OR o.genero_musical LIKE '%' + @genero_musical + '%')
		AND (@ubicacion IS NULL OR o.ubicacion LIKE '%' + @ubicacion + '%')
		AND (@tarifa_max IS NULL OR o.tarifa_aproximada <= @tarifa_max)
		AND (@busqueda IS NULL OR o.titulo LIKE '%' + @busqueda + '%' OR o.descripcion LIKE '%' + @busqueda + '%')
	ORDER BY o.fecha_publicacion DESC
	OFFSET @offset ROWS FETCH NEXT @tamano_pagina ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_ObtenerOfertaDetalle]
	@id_ofertaservicio INT
AS
BEGIN
	SET NOCOUNT ON;

	-- Detalle Oferta
	SELECT 
		o.id_ofertaservicio, o.titulo, o.descripcion, o.genero_musical, o.tarifa_aproximada, o.ubicacion, o.disponible, o.fecha_publicacion,
		u.id_usuario AS artista_id, u.nombre AS artista_nombre, u.email AS artista_email, u.tipo_perfil AS artista_tipo, u.foto_perfil_url, u.verificado AS artista_verificado
	FROM dbo.OfertaServicio o
	INNER JOIN dbo.Usuario u ON u.id_usuario = o.id_usuario
	WHERE o.id_ofertaservicio = @id_ofertaservicio;

	-- Media adjunta
	SELECT id_contratacionmultimedia, id_oferta, tipo, url, descripcion, fecha_subida
	FROM dbo.ContratacionMultimedia
	WHERE id_oferta = @id_ofertaservicio;
END
GO

-- --- Solicitudes de Contratación ---

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_CrearSolicitud]
	@id_usuario INT,
	@titulo NVARCHAR(150),
	@descripcion NVARCHAR(1000) = NULL,
	@fecha_evento DATE = NULL,
	@presupuesto DECIMAL(10,2) = NULL,
	@ubicacion NVARCHAR(100) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		INSERT INTO dbo.SolicitudContratacion (id_usuario, titulo, descripcion, fecha_evento, presupuesto, ubicacion, abierta, fecha_publicacion)
		VALUES (@id_usuario, @titulo, @descripcion, @fecha_evento, @presupuesto, @ubicacion, 1, GETDATE());

		DECLARE @id_solicitud INT = SCOPE_IDENTITY();

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_usuario, 'CREAR_SOLICITUD_CONTRATACION', 'SolicitudContratacion', @id_solicitud, CONCAT('Solicitud: ', @titulo), GETDATE());

		SELECT @id_solicitud AS id_solicitudcontratacion, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_solicitudcontratacion, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_ActualizarSolicitud]
	@id_solicitudcontratacion INT,
	@id_usuario INT,
	@titulo NVARCHAR(150),
	@descripcion NVARCHAR(1000) = NULL,
	@fecha_evento DATE = NULL,
	@presupuesto DECIMAL(10,2) = NULL,
	@ubicacion NVARCHAR(100) = NULL,
	@abierta BIT = 1
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF NOT EXISTS (SELECT 1 FROM dbo.SolicitudContratacion WHERE id_solicitudcontratacion = @id_solicitudcontratacion AND id_usuario = @id_usuario)
		BEGIN
			SELECT 'ERROR: La solicitud no existe o no le pertenece' AS mensaje;
			RETURN;
		END

		UPDATE dbo.SolicitudContratacion
		SET titulo = @titulo,
			descripcion = @descripcion,
			fecha_evento = @fecha_evento,
			presupuesto = @presupuesto,
			ubicacion = @ubicacion,
			abierta = @abierta
		WHERE id_solicitudcontratacion = @id_solicitudcontratacion;

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_CambiarEstadoSolicitud]
	@id_solicitudcontratacion INT,
	@id_usuario INT,
	@abierta BIT
AS
BEGIN
	SET NOCOUNT ON;
	UPDATE dbo.SolicitudContratacion 
	SET abierta = @abierta 
	WHERE id_solicitudcontratacion = @id_solicitudcontratacion AND id_usuario = @id_usuario;

	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_EliminarSolicitud]
	@id_solicitudcontratacion INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF NOT EXISTS (SELECT 1 FROM dbo.SolicitudContratacion WHERE id_solicitudcontratacion = @id_solicitudcontratacion AND id_usuario = @id_usuario)
		BEGIN
			SELECT 'ERROR: Solicitud no encontrada o permiso denegado' AS mensaje;
			RETURN;
		END

		BEGIN TRANSACTION;
			DELETE FROM dbo.ContratacionMultimedia WHERE id_solicitud = @id_solicitudcontratacion;
			DELETE FROM dbo.Postulacion WHERE id_solicitud = @id_solicitudcontratacion;
			DELETE FROM dbo.SolicitudContratacion WHERE id_solicitudcontratacion = @id_solicitudcontratacion;
		COMMIT TRANSACTION;

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_ObtenerSolicitudes]
	@busqueda NVARCHAR(100) = NULL,
	@ubicacion NVARCHAR(100) = NULL,
	@presupuesto_min DECIMAL(10,2) = NULL,
	@pagina INT = 1,
	@tamano_pagina INT = 10
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @offset INT = (@pagina - 1) * @tamano_pagina;

	SELECT 
		s.id_solicitudcontratacion, s.titulo, s.descripcion, s.fecha_evento, s.presupuesto, s.ubicacion, s.abierta, s.fecha_publicacion,
		u.id_usuario AS contratante_id, u.nombre AS contratante_nombre, u.tipo_perfil AS contratante_tipo, u.foto_perfil_url,
		(SELECT COUNT(1) FROM dbo.Postulacion p WHERE p.id_solicitud = s.id_solicitudcontratacion) AS total_postulaciones
	FROM dbo.SolicitudContratacion s
	INNER JOIN dbo.Usuario u ON u.id_usuario = s.id_usuario
	WHERE s.abierta = 1 AND u.estado = 1
		AND (@ubicacion IS NULL OR s.ubicacion LIKE '%' + @ubicacion + '%')
		AND (@presupuesto_min IS NULL OR s.presupuesto >= @presupuesto_min)
		AND (@busqueda IS NULL OR s.titulo LIKE '%' + @busqueda + '%' OR s.descripcion LIKE '%' + @busqueda + '%')
	ORDER BY s.fecha_publicacion DESC
	OFFSET @offset ROWS FETCH NEXT @tamano_pagina ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_ObtenerSolicitudDetalle]
	@id_solicitudcontratacion INT
AS
BEGIN
	SET NOCOUNT ON;

	-- Detalle Solicitud
	SELECT 
		s.id_solicitudcontratacion, s.titulo, s.descripcion, s.fecha_evento, s.presupuesto, s.ubicacion, s.abierta, s.fecha_publicacion,
		u.id_usuario AS contratante_id, u.nombre AS contratante_nombre, u.email AS contratante_email, u.foto_perfil_url
	FROM dbo.SolicitudContratacion s
	INNER JOIN dbo.Usuario u ON u.id_usuario = s.id_usuario
	WHERE s.id_solicitudcontratacion = @id_solicitudcontratacion;

	-- Media adjunta
	SELECT id_contratacionmultimedia, id_solicitud, tipo, url, descripcion, fecha_subida
	FROM dbo.ContratacionMultimedia
	WHERE id_solicitud = @id_solicitudcontratacion;
END
GO

-- --- Postulaciones & Tratos ---

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_CrearPostulacion]
	@id_oferta INT = NULL,
	@id_solicitud INT = NULL,
	@id_usuario_emisor INT,
	@mensaje NVARCHAR(500) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		-- Validar la restricción CHECK de exclusión mutua
		IF (@id_oferta IS NULL AND @id_solicitud IS NULL) OR (@id_oferta IS NOT NULL AND @id_solicitud IS NOT NULL)
		BEGIN
			SELECT -1 AS id_postulacion, 'Debe especificar id_oferta O id_solicitud (únicamente uno de los dos)' AS mensaje;
			RETURN;
		END

		-- Verificar duplicados activos
		IF EXISTS (SELECT 1 FROM dbo.Postulacion WHERE id_usuario_emisor = @id_usuario_emisor AND ISNULL(id_oferta,0) = ISNULL(@id_oferta,0) AND ISNULL(id_solicitud,0) = ISNULL(@id_solicitud,0) AND estado = 'PENDIENTE')
		BEGIN
			SELECT -1 AS id_postulacion, 'Ya tienes una postulación/mensaje pendiente registrado' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.Postulacion (id_oferta, id_solicitud, id_usuario_emisor, mensaje, estado, fecha)
		VALUES (@id_oferta, @id_solicitud, @id_usuario_emisor, @mensaje, 'PENDIENTE', GETDATE());

		DECLARE @id_postulacion INT = SCOPE_IDENTITY();

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_usuario_emisor, 'NUEVA_POSTULACION', 'Postulacion', @id_postulacion, 'Envío de interés/postulación', GETDATE());

		SELECT @id_postulacion AS id_postulacion, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_postulacion, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_ResponderPostulacion]
	@id_postulacion INT,
	@id_usuario_receptor INT,
	@nuevo_estado NVARCHAR(15) -- 'ACEPTADA' o 'RECHAZADA'
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF @nuevo_estado NOT IN ('ACEPTADA', 'RECHAZADA')
		BEGIN
			SELECT 'ERROR: Estado inválido (Debe ser ACEPTADA o RECHAZADA)' AS mensaje;
			RETURN;
		END

		-- Verificar que el receptor sea el dueño de la oferta o la solicitud
		DECLARE @es_dueno BIT = 0;

		SELECT @es_dueno = 1 
		FROM dbo.Postulacion p
		LEFT JOIN dbo.OfertaServicio o ON o.id_ofertaservicio = p.id_oferta
		LEFT JOIN dbo.SolicitudContratacion s ON s.id_solicitudcontratacion = p.id_solicitud
		WHERE p.id_postulacion = @id_postulacion AND (o.id_usuario = @id_usuario_receptor OR s.id_usuario = @id_usuario_receptor);

		IF @es_dueno = 0
		BEGIN
			SELECT 'ERROR: No tienes permiso para responder a esta postulación' AS mensaje;
			RETURN;
		END

		UPDATE dbo.Postulacion
		SET estado = @nuevo_estado
		WHERE id_postulacion = @id_postulacion;

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_usuario_receptor, 'RESPONDER_POSTULACION', 'Postulacion', @id_postulacion, CONCAT('Postulación marcada como ', @nuevo_estado), GETDATE());

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_ObtenerPostulaciones]
	@id_oferta INT = NULL,
	@id_solicitud INT = NULL,
	@id_usuario_emisor INT = NULL
AS
BEGIN
	SET NOCOUNT ON;
	SELECT 
		p.id_postulacion, p.id_oferta, p.id_solicitud, p.mensaje, p.estado, p.fecha,
		u.id_usuario AS emisor_id, u.nombre AS emisor_nombre, u.email AS emisor_email, u.foto_perfil_url AS emisor_foto, u.tipo_perfil AS emisor_tipo,
		o.titulo AS oferta_titulo, s.titulo AS solicitud_titulo
	FROM dbo.Postulacion p
	INNER JOIN dbo.Usuario u ON u.id_usuario = p.id_usuario_emisor
	LEFT JOIN dbo.OfertaServicio o ON o.id_ofertaservicio = p.id_oferta
	LEFT JOIN dbo.SolicitudContratacion s ON s.id_solicitudcontratacion = p.id_solicitud
	WHERE (@id_oferta IS NULL OR p.id_oferta = @id_oferta)
		AND (@id_solicitud IS NULL OR p.id_solicitud = @id_solicitud)
		AND (@id_usuario_emisor IS NULL OR p.id_usuario_emisor = @id_usuario_emisor)
	ORDER BY p.fecha DESC;
END
GO

-- --- Contratación Multimedia ---

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_AgregarMedia]
	@id_oferta INT = NULL,
	@id_solicitud INT = NULL,
	@tipo NVARCHAR(10),
	@url NVARCHAR(300),
	@descripcion NVARCHAR(255) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF (@id_oferta IS NULL AND @id_solicitud IS NULL) OR (@id_oferta IS NOT NULL AND @id_solicitud IS NOT NULL)
		BEGIN
			SELECT -1 AS id_contratacionmultimedia, 'Debe especificar id_oferta O id_solicitud' AS mensaje;
			RETURN;
		END

		IF @tipo NOT IN ('FOTO', 'VIDEO')
		BEGIN
			SELECT -1 AS id_contratacionmultimedia, 'Tipo multimedia inválido (Solo FOTO o VIDEO)' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.ContratacionMultimedia (id_oferta, id_solicitud, tipo, url, descripcion, fecha_subida)
		VALUES (@id_oferta, @id_solicitud, @tipo, @url, @descripcion, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_contratacionmultimedia, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_contratacionmultimedia, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Contratacion_EliminarMedia]
	@id_contratacionmultimedia INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @es_dueno BIT = 0;

	SELECT @es_dueno = 1
	FROM dbo.ContratacionMultimedia cm
	LEFT JOIN dbo.OfertaServicio o ON o.id_ofertaservicio = cm.id_oferta
	LEFT JOIN dbo.SolicitudContratacion s ON s.id_solicitudcontratacion = cm.id_solicitud
	WHERE cm.id_contratacionmultimedia = @id_contratacionmultimedia AND (o.id_usuario = @id_usuario OR s.id_usuario = @id_usuario);

	IF @es_dueno = 0
	BEGIN
		SELECT 'ERROR: Elemento no encontrado o no pertenece a su publicación' AS mensaje;
		RETURN;
	END

	DELETE FROM dbo.ContratacionMultimedia WHERE id_contratacionmultimedia = @id_contratacionmultimedia;
	SELECT 'OK' AS mensaje;
END
GO

