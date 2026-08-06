
/* ================================================================
   SECCIÓN 3 - MÓDULO PERFIL (Portafolio, Grupos y Cursos)
   ================================================================ */

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_ObtenerDetalle]
	@id_usuario_perfil INT,
	@id_usuario_visitante INT = NULL
AS
BEGIN
	SET NOCOUNT ON;

	-- 1. Información principal del Usuario
	SELECT 
		u.id_usuario, u.nombre, u.email, u.tipo_perfil, u.biografia, u.ubicacion, u.genero_musical, u.instrumento, u.foto_perfil_url,
		u.email_verificado, u.verificado, u.estado, u.fecha_creacion, u.id_rol, r.nombre AS rol_nombre,
		(SELECT COUNT(1) FROM dbo.Seguidor s WHERE s.id_usuario = u.id_usuario) AS total_seguidores,
		(SELECT COUNT(1) FROM dbo.Seguidor s WHERE s.id_seguidor = u.id_usuario) AS total_seguidos,
		(SELECT COUNT(1) FROM dbo.Publicacion p WHERE p.id_usuario = u.id_usuario) AS total_publicaciones,
		(SELECT COUNT(1) FROM dbo.OfertaServicio o WHERE o.id_usuario = u.id_usuario AND o.disponible = 1) AS total_ofertas_activas,
		(SELECT COUNT(1) FROM dbo.Evento e WHERE e.id_organizador = u.id_usuario) AS total_eventos,
		CASE 
			WHEN @id_usuario_visitante IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Seguidor s WHERE s.id_usuario = u.id_usuario AND s.id_seguidor = @id_usuario_visitante) 
			THEN 1 ELSE 0 
		END AS es_seguido_por_visitante
	FROM dbo.Usuario u
	INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
	WHERE u.id_usuario = @id_usuario_perfil;

	-- 2. Portafolio de Contenido Multimedia del perfil
	SELECT id_contenidomultimedia, id_usuario, tipo, url, descripcion, fecha_subida
	FROM dbo.ContenidoMultimedia
	WHERE id_usuario = @id_usuario_perfil
	ORDER BY fecha_subida DESC;

	-- 3. Si es GRUPO: Integrantes del grupo
	SELECT g.id_grupointegrante, g.id_integrante, u.nombre AS integrante_nombre, u.foto_perfil_url, u.instrumento, g.rol_en_grupo, g.fecha_union
	FROM dbo.GrupoIntegrante g
	INNER JOIN dbo.Usuario u ON u.id_usuario = g.id_integrante
	WHERE g.id_grupo = @id_usuario_perfil;

	-- 4. Si es ESCUELA: Cursos ofrecidos
	SELECT c.id_escuelacurso, c.nombre_curso, c.descripcion, c.horario, c.precio, c.estado, c.fecha_creacion
	FROM dbo.EscuelaCurso c
	WHERE c.id_escuela = @id_usuario_perfil AND c.estado = 1
	ORDER BY c.fecha_creacion DESC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_Actualizar]
	@id_usuario INT,
	@nombre NVARCHAR(150),
	@biografia NVARCHAR(500) = NULL,
	@ubicacion NVARCHAR(100) = NULL,
	@genero_musical NVARCHAR(80) = NULL,
	@instrumento NVARCHAR(80) = NULL,
	@foto_perfil_url NVARCHAR(300) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		UPDATE dbo.Usuario
		SET nombre = @nombre,
			biografia = @biografia,
			ubicacion = @ubicacion,
			genero_musical = @genero_musical,
			instrumento = @instrumento,
			foto_perfil_url = ISNULL(@foto_perfil_url, foto_perfil_url),
			fecha_actualizacion = GETDATE()
		WHERE id_usuario = @id_usuario;

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_usuario, 'ACTUALIZAR_PERFIL', 'Usuario', @id_usuario, 'Actualización de datos generales del perfil', GETDATE());

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_SubirMedia]
	@id_usuario INT,
	@tipo NVARCHAR(10),
	@url NVARCHAR(300),
	@descripcion NVARCHAR(255) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF @tipo NOT IN ('FOTO', 'VIDEO', 'AUDIO')
		BEGIN
			SELECT -1 AS id_contenidomultimedia, 'Tipo de archivo no permitido (FOTO, VIDEO o AUDIO)' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.ContenidoMultimedia (id_usuario, tipo, url, descripcion, fecha_subida)
		VALUES (@id_usuario, @tipo, @url, @descripcion, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_contenidomultimedia, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_contenidomultimedia, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_EliminarMedia]
	@id_contenidomultimedia INT,
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	IF NOT EXISTS (SELECT 1 FROM dbo.ContenidoMultimedia WHERE id_contenidomultimedia = @id_contenidomultimedia AND id_usuario = @id_usuario)
	BEGIN
		SELECT 'ERROR: El elemento multimedia no existe o no pertenece al usuario' AS mensaje;
		RETURN;
	END

	DELETE FROM dbo.ContenidoMultimedia WHERE id_contenidomultimedia = @id_contenidomultimedia;
	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_ObtenerMedia]
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	SELECT id_contenidomultimedia, id_usuario, tipo, url, descripcion, fecha_subida
	FROM dbo.ContenidoMultimedia
	WHERE id_usuario = @id_usuario
	ORDER BY fecha_subida DESC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_AgregarIntegrante]
	@id_grupo INT,
	@id_integrante INT,
	@rol_en_grupo NVARCHAR(80) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF (SELECT tipo_perfil FROM dbo.Usuario WHERE id_usuario = @id_grupo) <> 'GRUPO'
		BEGIN
			SELECT -1 AS id_grupointegrante, 'El usuario propietario debe ser de tipo GRUPO' AS mensaje;
			RETURN;
		END

		IF EXISTS (SELECT 1 FROM dbo.GrupoIntegrante WHERE id_grupo = @id_grupo AND id_integrante = @id_integrante)
		BEGIN
			SELECT -1 AS id_grupointegrante, 'El integrante ya forma parte de este grupo' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.GrupoIntegrante (id_grupo, id_integrante, rol_en_grupo, fecha_union)
		VALUES (@id_grupo, @id_integrante, @rol_en_grupo, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_grupointegrante, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_grupointegrante, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_EliminarIntegrante]
	@id_grupo INT,
	@id_integrante INT
AS
BEGIN
	SET NOCOUNT ON;
	DELETE FROM dbo.GrupoIntegrante WHERE id_grupo = @id_grupo AND id_integrante = @id_integrante;
	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_ObtenerIntegrantes]
	@id_grupo INT
AS
BEGIN
	SET NOCOUNT ON;
	SELECT g.id_grupointegrante, g.id_grupo, g.id_integrante, u.nombre, u.email, u.foto_perfil_url, u.instrumento, g.rol_en_grupo, g.fecha_union
	FROM dbo.GrupoIntegrante g
	INNER JOIN dbo.Usuario u ON u.id_usuario = g.id_integrante
	WHERE g.id_grupo = @id_grupo
	ORDER BY g.fecha_union ASC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_CrearCurso]
	@id_escuela INT,
	@nombre_curso NVARCHAR(150),
	@descripcion NVARCHAR(300) = NULL,
	@horario NVARCHAR(150) = NULL,
	@precio DECIMAL(10,2) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF (SELECT tipo_perfil FROM dbo.Usuario WHERE id_usuario = @id_escuela) <> 'ESCUELA'
		BEGIN
			SELECT -1 AS id_escuelacurso, 'Solo las cuentas de tipo ESCUELA pueden registrar cursos' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.EscuelaCurso (id_escuela, nombre_curso, descripcion, horario, precio, estado, fecha_creacion)
		VALUES (@id_escuela, @nombre_curso, @descripcion, @horario, @precio, 1, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_escuelacurso, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_escuelacurso, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_ActualizarCurso]
	@id_escuelacurso INT,
	@id_escuela INT,
	@nombre_curso NVARCHAR(150),
	@descripcion NVARCHAR(300) = NULL,
	@horario NVARCHAR(150) = NULL,
	@precio DECIMAL(10,2) = NULL,
	@estado BIT = 1
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF NOT EXISTS (SELECT 1 FROM dbo.EscuelaCurso WHERE id_escuelacurso = @id_escuelacurso AND id_escuela = @id_escuela)
		BEGIN
			SELECT 'ERROR: El curso no existe o no pertenece a esta escuela' AS mensaje;
			RETURN;
		END

		UPDATE dbo.EscuelaCurso
		SET nombre_curso = @nombre_curso,
			descripcion = @descripcion,
			horario = @horario,
			precio = @precio,
			estado = @estado
		WHERE id_escuelacurso = @id_escuelacurso;

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_EliminarCurso]
	@id_escuelacurso INT,
	@id_escuela INT
AS
BEGIN
	SET NOCOUNT ON;
	DELETE FROM dbo.EscuelaCurso WHERE id_escuelacurso = @id_escuelacurso AND id_escuela = @id_escuela;
	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Perfil_ObtenerCursos]
	@id_escuela INT
AS
BEGIN
	SET NOCOUNT ON;
	SELECT id_escuelacurso, id_escuela, nombre_curso, descripcion, horario, precio, estado, fecha_creacion
	FROM dbo.EscuelaCurso
	WHERE id_escuela = @id_escuela
	ORDER BY fecha_creacion DESC;
END
GO

