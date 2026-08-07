/* ================================================================
   SECCIÓN 4 - MÓDULO FEED (Publicaciones, Likes y Comentarios)
   ================================================================ */

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_CrearPublicacion]
	@id_usuario INT,
	@texto NVARCHAR(1000) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF ISNULL(LEN(TRIM(@texto)), 0) = 0
		BEGIN
			SELECT -1 AS id_publicacion, 'El contenido de la publicación no puede estar vacío' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.Publicacion (id_usuario, texto, fecha_publicacion)
		VALUES (@id_usuario, @texto, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_publicacion, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_publicacion, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_AgregarMedia]
	@id_publicacion INT,
	@tipo NVARCHAR(10),
	@url NVARCHAR(300),
	@descripcion NVARCHAR(255) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF @tipo NOT IN ('FOTO', 'VIDEO')
		BEGIN
			SELECT -1 AS id_publicacionmultimedia, 'Tipo multimedia inválido para feed (Solo FOTO o VIDEO)' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.PublicacionMultimedia (id_publicacion, tipo, url, descripcion, fecha_subida)
		VALUES (@id_publicacion, @tipo, @url, @descripcion, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_publicacionmultimedia, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_publicacionmultimedia, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_EliminarMedia]
	@id_publicacionmultimedia INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	IF NOT EXISTS (
		SELECT 1 FROM dbo.PublicacionMultimedia pm 
		INNER JOIN dbo.Publicacion p ON p.id_publicacion = pm.id_publicacion 
		WHERE pm.id_publicacionmultimedia = @id_publicacionmultimedia AND p.id_usuario = @id_usuario
	)
	BEGIN
		SELECT 'ERROR: Archivo multimedia no existe o no le pertenece' AS mensaje;
		RETURN;
	END

	DELETE FROM dbo.PublicacionMultimedia WHERE id_publicacionmultimedia = @id_publicacionmultimedia;
	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_EliminarPublicacion]
	@id_publicacion INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		DECLARE @es_admin BIT = 0;
		SELECT @es_admin = CASE WHEN r.nombre IN ('ADMIN', 'MODERADOR') THEN 1 ELSE 0 END
		FROM dbo.Usuario u INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol WHERE u.id_usuario = @id_usuario;

		IF NOT EXISTS (SELECT 1 FROM dbo.Publicacion WHERE id_publicacion = @id_publicacion AND (id_usuario = @id_usuario OR @es_admin = 1))
		BEGIN
			SELECT 'ERROR: Publicación no encontrada o permiso denegado' AS mensaje;
			RETURN;
		END

		BEGIN TRANSACTION;
			DELETE FROM dbo.PublicacionMultimedia WHERE id_publicacion = @id_publicacion;
			DELETE FROM dbo.PublicacionLike WHERE id_publicacion = @id_publicacion;
			DELETE FROM dbo.PublicacionComentario WHERE id_publicacion = @id_publicacion;
			DELETE FROM dbo.Publicacion WHERE id_publicacion = @id_publicacion;
		COMMIT TRANSACTION;

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_ObtenerPosts]
	@id_usuario_visitante INT = NULL,
	@pagina INT = 1,
	@tamano_pagina INT = 10
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @offset INT = (@pagina - 1) * @tamano_pagina;

	-- 1. Publicaciones con contadores
	SELECT 
		p.id_publicacion, p.texto, p.fecha_publicacion,
		u.id_usuario AS autor_id, u.nombre AS autor_nombre, u.tipo_perfil AS autor_tipo, u.foto_perfil_url AS autor_foto, u.verificado AS autor_verificado,
		(SELECT COUNT(1) FROM dbo.PublicacionLike l WHERE l.id_publicacion = p.id_publicacion) AS total_likes,
		(SELECT COUNT(1) FROM dbo.PublicacionComentario c WHERE c.id_publicacion = p.id_publicacion) AS total_comentarios,
		(SELECT COUNT(1) FROM dbo.PublicacionMultimedia m WHERE m.id_publicacion = p.id_publicacion) AS total_multimedia,
		CASE 
			WHEN @id_usuario_visitante IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.PublicacionLike l WHERE l.id_publicacion = p.id_publicacion AND l.id_usuario = @id_usuario_visitante)
			THEN 1 ELSE 0 
		END AS dio_like
	FROM dbo.Publicacion p
	INNER JOIN dbo.Usuario u ON u.id_usuario = p.id_usuario
	WHERE u.estado = 1
	ORDER BY p.fecha_publicacion DESC
	OFFSET @offset ROWS FETCH NEXT @tamano_pagina ROWS ONLY;

	-- 2. Multimedia asociada a ese conjunto de publicaciones
	SELECT pm.id_publicacionmultimedia, pm.id_publicacion, pm.tipo, pm.url, pm.descripcion
	FROM dbo.PublicacionMultimedia pm
	INNER JOIN dbo.Publicacion p ON p.id_publicacion = pm.id_publicacion
	INNER JOIN dbo.Usuario u ON u.id_usuario = p.id_usuario
	WHERE u.estado = 1
	ORDER BY pm.id_publicacion DESC, pm.id_publicacionmultimedia ASC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_ObtenerPostDetalle]
	@id_publicacion INT,
	@id_usuario_visitante INT = NULL
AS
BEGIN
	SET NOCOUNT ON;

	-- 1. Detalle del Post
	SELECT 
		p.id_publicacion, p.texto, p.fecha_publicacion,
		u.id_usuario AS autor_id, u.nombre AS autor_nombre, u.tipo_perfil AS autor_tipo, u.foto_perfil_url AS autor_foto, u.verificado AS autor_verificado,
		(SELECT COUNT(1) FROM dbo.PublicacionLike l WHERE l.id_publicacion = p.id_publicacion) AS total_likes,
		(SELECT COUNT(1) FROM dbo.PublicacionComentario c WHERE c.id_publicacion = p.id_publicacion) AS total_comentarios,
		CASE 
			WHEN @id_usuario_visitante IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.PublicacionLike l WHERE l.id_publicacion = p.id_publicacion AND l.id_usuario = @id_usuario_visitante)
			THEN 1 ELSE 0 
		END AS dio_like
	FROM dbo.Publicacion p
	INNER JOIN dbo.Usuario u ON u.id_usuario = p.id_usuario
	WHERE p.id_publicacion = @id_publicacion;

	-- 2. Fotos/videos del post
	SELECT id_publicacionmultimedia, id_publicacion, tipo, url, descripcion
	FROM dbo.PublicacionMultimedia
	WHERE id_publicacion = @id_publicacion;

	-- 3. Comentarios del post
	SELECT 
		c.id_publicacioncomentario, c.texto, c.fecha,
		u.id_usuario AS usuario_id, u.nombre AS usuario_nombre, u.foto_perfil_url AS usuario_foto
	FROM dbo.PublicacionComentario c
	INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
	WHERE c.id_publicacion = @id_publicacion
	ORDER BY c.fecha ASC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_ToggleLike]
	@id_publicacion INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF EXISTS (SELECT 1 FROM dbo.PublicacionLike WHERE id_publicacion = @id_publicacion AND id_usuario = @id_usuario)
		BEGIN
			DELETE FROM dbo.PublicacionLike WHERE id_publicacion = @id_publicacion AND id_usuario = @id_usuario;
			SELECT 'UNLIKED' AS accion, (SELECT COUNT(1) FROM dbo.PublicacionLike WHERE id_publicacion = @id_publicacion) AS total_likes;
		END
		ELSE
		BEGIN
			INSERT INTO dbo.PublicacionLike (id_publicacion, id_usuario, fecha) VALUES (@id_publicacion, @id_usuario, GETDATE());
			SELECT 'LIKED' AS accion, (SELECT COUNT(1) FROM dbo.PublicacionLike WHERE id_publicacion = @id_publicacion) AS total_likes;
		END
	END TRY
	BEGIN CATCH
		SELECT 'ERROR' AS accion, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_AgregarComentario]
	@id_publicacion INT,
	@id_usuario INT,
	@texto NVARCHAR(500)
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF ISNULL(LEN(TRIM(@texto)), 0) = 0
		BEGIN
			SELECT -1 AS id_publicacioncomentario, 'El comentario no puede estar vacío' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.PublicacionComentario (id_publicacion, id_usuario, texto, fecha)
		VALUES (@id_publicacion, @id_usuario, @texto, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_publicacioncomentario, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_publicacioncomentario, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_EliminarComentario]
	@id_publicacioncomentario INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @es_dueno_post BIT = 0;
	
	SELECT @es_dueno_post = CASE WHEN p.id_usuario = @id_usuario THEN 1 ELSE 0 END
	FROM dbo.PublicacionComentario c
	INNER JOIN dbo.Publicacion p ON p.id_publicacion = c.id_publicacion
	WHERE c.id_publicacioncomentario = @id_publicacioncomentario;

	IF NOT EXISTS (
		SELECT 1 FROM dbo.PublicacionComentario 
		WHERE id_publicacioncomentario = @id_publicacioncomentario AND (id_usuario = @id_usuario OR @es_dueno_post = 1)
	)
	BEGIN
		SELECT 'ERROR: No posee autoría ni permiso para eliminar este comentario' AS mensaje;
		RETURN;
	END

	DELETE FROM dbo.PublicacionComentario WHERE id_publicacioncomentario = @id_publicacioncomentario;
	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Feed_ObtenerComentarios]
	@id_publicacion INT
AS
BEGIN
	SET NOCOUNT ON;
	SELECT 
		c.id_publicacioncomentario, c.id_publicacion, c.texto, c.fecha,
		u.id_usuario, u.nombre, u.foto_perfil_url, u.tipo_perfil
	FROM dbo.PublicacionComentario c
	INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
	WHERE c.id_publicacion = @id_publicacion
	ORDER BY c.fecha ASC;
END
GO

