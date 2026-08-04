USE [MisostenidoDB]
GO

/* ================================================================
   MISOSTENIDO - PROCEDIMIENTOS ALMACENADOS COMPLETOS
   Plataforma de promoción y contratación de artistas nicaragüenses.
   ================================================================ */


/* ================================================================
   SECCIÓN 1 - AUTENTICACIÓN, REGISTRO Y SEGURIDAD
   ================================================================ */

CREATE OR ALTER PROCEDURE [dbo].[sp_RegistrarUsuario]
	@nombre NVARCHAR(150),
	@email NVARCHAR(150),
	@contrasena_hash NVARCHAR(255),
	@tipo_perfil NVARCHAR(15)
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF EXISTS (SELECT 1 FROM dbo.Usuario WHERE email = @email)
		BEGIN
			SELECT -1 AS id_usuario, 'El correo ya está registrado' AS mensaje;
			RETURN;
		END

		IF @tipo_perfil NOT IN ('INDIVIDUAL', 'GRUPO', 'ESCUELA')
		BEGIN
			SELECT -1 AS id_usuario, 'Tipo de perfil inválido (Debe ser INDIVIDUAL, GRUPO o ESCUELA)' AS mensaje;
			RETURN;
		END

		DECLARE @id_rol_usuario INT = (SELECT id_rol FROM dbo.Rol WHERE nombre = 'USUARIO');
		
		INSERT INTO dbo.Usuario (nombre, email, contrasena_hash, tipo_perfil, email_verificado, id_rol, verificado, estado, fecha_creacion)
		VALUES (@nombre, @email, @contrasena_hash, @tipo_perfil, 0, @id_rol_usuario, 0, 1, GETDATE());

		DECLARE @id_usuario INT = SCOPE_IDENTITY();

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_usuario, 'REGISTRO_USUARIO', 'Usuario', @id_usuario, CONCAT('Nuevo perfil tipo ', @tipo_perfil), GETDATE());

		SELECT @id_usuario AS id_usuario, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_usuario, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ObtenerUsuarioParaLogin]
	@email NVARCHAR(150)
AS
BEGIN
	SET NOCOUNT ON;
	SELECT u.id_usuario, u.nombre, u.email, u.contrasena_hash, u.tipo_perfil, u.foto_perfil_url, u.id_rol, r.nombre AS rol_nombre, u.estado, u.email_verificado, u.verificado
	FROM dbo.Usuario u 
	INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
	WHERE u.email = @email;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ObtenerPermisosUsuario]
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	SELECT p.codigo FROM dbo.Usuario u
	INNER JOIN dbo.RolPermiso rp ON rp.id_rol = u.id_rol
	INNER JOIN dbo.Permiso p ON p.id_permiso = rp.id_permiso
	WHERE u.id_usuario = @id_usuario;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_UsuarioTienePermiso]
	@id_usuario INT,
	@codigo_permiso NVARCHAR(50)
AS
BEGIN
	SET NOCOUNT ON;
	SELECT CASE WHEN EXISTS (
		SELECT 1 FROM dbo.Usuario u
		INNER JOIN dbo.RolPermiso rp ON rp.id_rol = u.id_rol
		INNER JOIN dbo.Permiso p ON p.id_permiso = rp.id_permiso
		WHERE u.id_usuario = @id_usuario AND p.codigo = @codigo_permiso
	) THEN 1 ELSE 0 END AS tiene_permiso;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_CrearSesion]
	@id_usuario INT,
	@refresh_token NVARCHAR(500),
	@dispositivo NVARCHAR(200),
	@ip_origen NVARCHAR(50),
	@dias_expiracion INT = 30
AS
BEGIN
	SET NOCOUNT ON;
	INSERT INTO dbo.SesionUsuario (id_usuario, refresh_token, dispositivo, ip_origen, revocado, fecha_creacion, fecha_expiracion)
	VALUES (@id_usuario, @refresh_token, @dispositivo, @ip_origen, 0, GETDATE(), DATEADD(DAY, @dias_expiracion, GETDATE()));
	
	INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
	VALUES (@id_usuario, 'INICIO_SESION', 'Usuario', @id_usuario, @dispositivo, GETDATE());
	
	SELECT SCOPE_IDENTITY() AS id_sesionusuario;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_CerrarSesion]
	@refresh_token NVARCHAR(500)
AS
BEGIN
	SET NOCOUNT ON;
	UPDATE dbo.SesionUsuario SET revocado = 1 WHERE refresh_token = @refresh_token;
	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_RevocarTodasLasSesiones]
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	UPDATE dbo.SesionUsuario SET revocado = 1 WHERE id_usuario = @id_usuario AND revocado = 0;
	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_CrearTokenVerificacion]
	@id_usuario INT,
	@token NVARCHAR(255),
	@tipo NVARCHAR(20),
	@horas_expiracion INT = 24
AS
BEGIN
	SET NOCOUNT ON;
	INSERT INTO dbo.TokenVerificacion (id_usuario, token, tipo, usado, fecha_expiracion, fecha_creacion)
	VALUES (@id_usuario, @token, @tipo, 0, DATEADD(HOUR, @horas_expiracion, GETDATE()), GETDATE());
	
	SELECT SCOPE_IDENTITY() AS id_tokenverificacion;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ActualizarContrasena]
	@id_usuario INT,
	@nuevo_hash NVARCHAR(255)
AS
BEGIN
	SET NOCOUNT ON;
	UPDATE dbo.Usuario SET contrasena_hash = @nuevo_hash, fecha_actualizacion = GETDATE() WHERE id_usuario = @id_usuario;
	UPDATE dbo.SesionUsuario SET revocado = 1 WHERE id_usuario = @id_usuario AND revocado = 0;
	
	INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
	VALUES (@id_usuario, 'CAMBIO_CONTRASENA', 'Usuario', @id_usuario, NULL, GETDATE());
	
	SELECT 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ValidarSesionActiva]
	@refresh_token NVARCHAR(500)
AS
BEGIN
	SET NOCOUNT ON;
	SELECT u.id_usuario, u.nombre, u.email, u.tipo_perfil, u.foto_perfil_url, u.id_rol, r.nombre AS rol_nombre
	FROM dbo.SesionUsuario s
	INNER JOIN dbo.Usuario u ON u.id_usuario = s.id_usuario
	INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
	WHERE s.refresh_token = @refresh_token AND s.revocado = 0 AND s.fecha_expiracion > GETDATE() AND u.estado = 1;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ValidarTokenVerificacion]
	@token NVARCHAR(255)
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @id_usuario INT, @tipo NVARCHAR(20), @usado BIT, @fecha_expiracion DATETIME;

	SELECT @id_usuario = id_usuario, @tipo = tipo, @usado = usado, @fecha_expiracion = fecha_expiracion
	FROM dbo.TokenVerificacion WHERE token = @token;

	IF @id_usuario IS NULL
	BEGIN
		SELECT -1 AS id_usuario, 'Token no encontrado' AS mensaje;
		RETURN;
	END
	IF @usado = 1 OR @fecha_expiracion < GETDATE()
	BEGIN
		SELECT -1 AS id_usuario, 'Token inválido o expirado' AS mensaje;
		RETURN;
	END

	UPDATE dbo.TokenVerificacion SET usado = 1 WHERE token = @token;

	IF @tipo = 'VERIFICACION_EMAIL'
		UPDATE dbo.Usuario SET email_verificado = 1 WHERE id_usuario = @id_usuario;

	SELECT @id_usuario AS id_usuario, @tipo AS tipo, 'OK' AS mensaje;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_RegistrarOAutenticarGoogle]
	@nombre NVARCHAR(150),
	@email NVARCHAR(150),
	@foto_perfil_url NVARCHAR(300) = NULL,
	@tipo_perfil NVARCHAR(15) = 'INDIVIDUAL'
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		DECLARE @id_usuario INT;

		SELECT @id_usuario = id_usuario FROM dbo.Usuario WHERE email = @email;

		IF @id_usuario IS NULL
		BEGIN
			DECLARE @id_rol_usuario INT = (SELECT id_rol FROM dbo.Rol WHERE nombre = 'USUARIO');
			
			INSERT INTO dbo.Usuario (nombre, email, contrasena_hash, tipo_perfil, foto_perfil_url, email_verificado, id_rol, verificado, estado, fecha_creacion)
			VALUES (@nombre, @email, 'OAUTH_GOOGLE', @tipo_perfil, @foto_perfil_url, 1, @id_rol_usuario, 0, 1, GETDATE());

			SET @id_usuario = SCOPE_IDENTITY();

			INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
			VALUES (@id_usuario, 'REGISTRO_OAUTH_GOOGLE', 'Usuario', @id_usuario, CONCAT('Google OAuth - Tipo ', @tipo_perfil), GETDATE());
		END
		ELSE
		BEGIN
			IF @foto_perfil_url IS NOT NULL
				UPDATE dbo.Usuario SET foto_perfil_url = @foto_perfil_url, email_verificado = 1 WHERE id_usuario = @id_usuario;
		END

		SELECT u.id_usuario, u.nombre, u.email, u.tipo_perfil, u.foto_perfil_url, u.id_rol, r.nombre AS rol_nombre, u.estado
		FROM dbo.Usuario u
		INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
		WHERE u.id_usuario = @id_usuario;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_usuario, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO


/* ================================================================
   SECCIÓN 2 - MÓDULO INICIO (Portal Público / Cero Fricción)
   ================================================================ */

CREATE OR ALTER PROCEDURE [dbo].[sp_Inicio_ObtenerDestacados]
AS
BEGIN
	SET NOCOUNT ON;
	
	-- 1. Artistas / Grupos / Escuelas destacados (verificados o más recientes)
	SELECT TOP 6 
		u.id_usuario, u.nombre, u.tipo_perfil, u.biografia, u.ubicacion, u.genero_musical, u.instrumento, u.foto_perfil_url, u.verificado,
		(SELECT COUNT(1) FROM dbo.Seguidor s WHERE s.id_usuario = u.id_usuario) AS total_seguidores
	FROM dbo.Usuario u
	WHERE u.estado = 1
	ORDER BY u.verificado DESC, u.fecha_creacion DESC;

	-- 2. Publicaciones recientes del feed
	SELECT TOP 5
		p.id_publicacion, p.texto, p.fecha_publicacion,
		u.id_usuario, u.nombre AS autor_nombre, u.tipo_perfil AS autor_tipo, u.foto_perfil_url AS autor_foto, u.verificado AS autor_verificado,
		(SELECT COUNT(1) FROM dbo.PublicacionLike l WHERE l.id_publicacion = p.id_publicacion) AS total_likes,
		(SELECT COUNT(1) FROM dbo.PublicacionComentario c WHERE c.id_publicacion = p.id_publicacion) AS total_comentarios
	FROM dbo.Publicacion p
	INNER JOIN dbo.Usuario u ON u.id_usuario = p.id_usuario
	WHERE u.estado = 1
	ORDER BY p.fecha_publicacion DESC;

	-- 3. Próximos eventos destacados
	SELECT TOP 4
		e.id_evento, e.titulo, e.tipo_evento, e.fecha_evento, e.ubicacion,
		u.id_usuario AS organizador_id, u.nombre AS organizador_nombre, u.foto_perfil_url AS organizador_foto
	FROM dbo.Evento e
	INNER JOIN dbo.Usuario u ON u.id_usuario = e.id_organizador
	WHERE e.fecha_evento >= GETDATE() AND u.estado = 1
	ORDER BY e.fecha_evento ASC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Inicio_BuscarGlobal]
	@busqueda NVARCHAR(100) = NULL,
	@tipo_perfil NVARCHAR(15) = NULL,
	@genero_musical NVARCHAR(80) = NULL
AS
BEGIN
	SET NOCOUNT ON;

	-- Búsqueda en Usuarios
	SELECT 
		u.id_usuario, u.nombre, u.tipo_perfil, u.biografia, u.ubicacion, u.genero_musical, u.instrumento, u.foto_perfil_url, u.verificado,
		(SELECT COUNT(1) FROM dbo.Seguidor s WHERE s.id_usuario = u.id_usuario) AS total_seguidores
	FROM dbo.Usuario u
	WHERE u.estado = 1
		AND (@tipo_perfil IS NULL OR u.tipo_perfil = @tipo_perfil)
		AND (@genero_musical IS NULL OR u.genero_musical LIKE '%' + @genero_musical + '%')
		AND (@busqueda IS NULL OR u.nombre LIKE '%' + @busqueda + '%' OR u.biografia LIKE '%' + @busqueda + '%' OR u.instrumento LIKE '%' + @busqueda + '%')
	ORDER BY u.verificado DESC, u.nombre ASC;

	-- Búsqueda en Eventos Próximos
	SELECT 
		e.id_evento, e.titulo, e.descripcion, e.tipo_evento, e.fecha_evento, e.ubicacion,
		u.id_usuario AS organizador_id, u.nombre AS organizador_nombre
	FROM dbo.Evento e
	INNER JOIN dbo.Usuario u ON u.id_usuario = e.id_organizador
	WHERE e.fecha_evento >= GETDATE() AND u.estado = 1
		AND (@busqueda IS NULL OR e.titulo LIKE '%' + @busqueda + '%' OR e.descripcion LIKE '%' + @busqueda + '%' OR e.ubicacion LIKE '%' + @busqueda + '%')
	ORDER BY e.fecha_evento ASC;

	-- Búsqueda en Ofertas de Servicio
	SELECT 
		o.id_ofertaservicio, o.titulo, o.descripcion, o.genero_musical, o.tarifa_aproximada, o.ubicacion, o.fecha_publicacion,
		u.id_usuario, u.nombre AS artista_nombre, u.foto_perfil_url
	FROM dbo.OfertaServicio o
	INNER JOIN dbo.Usuario u ON u.id_usuario = o.id_usuario
	WHERE o.disponible = 1 AND u.estado = 1
		AND (@genero_musical IS NULL OR o.genero_musical LIKE '%' + @genero_musical + '%')
		AND (@busqueda IS NULL OR o.titulo LIKE '%' + @busqueda + '%' OR o.descripcion LIKE '%' + @busqueda + '%')
	ORDER BY o.fecha_publicacion DESC;
END
GO


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


/* ================================================================
   SECCIÓN 7 - MÓDULO SOCIAL (Seguidores y Red)
   ================================================================ */

CREATE OR ALTER PROCEDURE [dbo].[sp_Social_ToggleSeguir]
	@id_usuario INT,      -- Usuario al que se desea seguir/dejar de seguir
	@id_seguidor INT     -- Usuario que realiza la acción
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF @id_usuario = @id_seguidor
		BEGIN
			SELECT 'ERROR' AS accion, 'Un usuario no puede seguirse a sí mismo' AS mensaje;
			RETURN;
		END

		IF EXISTS (SELECT 1 FROM dbo.Seguidor WHERE id_usuario = @id_usuario AND id_seguidor = @id_seguidor)
		BEGIN
			DELETE FROM dbo.Seguidor WHERE id_usuario = @id_usuario AND id_seguidor = @id_seguidor;
			SELECT 'UNFOLLOWED' AS accion, 'Has dejado de seguir a este perfil' AS mensaje;
		END
		ELSE
		BEGIN
			INSERT INTO dbo.Seguidor (id_usuario, id_seguidor, fecha) VALUES (@id_usuario, @id_seguidor, GETDATE());
			SELECT 'FOLLOWED' AS accion, 'Ahora sigues a este perfil' AS mensaje;
		END
	END TRY
	BEGIN CATCH
		SELECT 'ERROR' AS accion, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Social_EsSeguidor]
	@id_usuario INT,
	@id_seguidor INT
AS
BEGIN
	SET NOCOUNT ON;
	SELECT CASE WHEN EXISTS (
		SELECT 1 FROM dbo.Seguidor WHERE id_usuario = @id_usuario AND id_seguidor = @id_seguidor
	) THEN 1 ELSE 0 END AS lo_sigue;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Social_ObtenerSeguidores]
	@id_usuario INT
AS
BEGIN
	SET NOCOUNT ON;
	SELECT s.id_seguidor_rel, u.id_usuario, u.nombre, u.foto_perfil_url, u.tipo_perfil, u.genero_musical, s.fecha AS fecha_seguimiento
	FROM dbo.Seguidor s
	INNER JOIN dbo.Usuario u ON u.id_usuario = s.id_seguidor
	WHERE s.id_usuario = @id_usuario
	ORDER BY s.fecha DESC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Social_ObtenerSeguidos]
	@id_seguidor INT
AS
BEGIN
	SET NOCOUNT ON;
	SELECT s.id_seguidor_rel, u.id_usuario, u.nombre, u.foto_perfil_url, u.tipo_perfil, u.genero_musical, s.fecha AS fecha_seguimiento
	FROM dbo.Seguidor s
	INNER JOIN dbo.Usuario u ON u.id_usuario = s.id_usuario
	WHERE s.id_seguidor = @id_seguidor
	ORDER BY s.fecha DESC;
END
GO


/* ================================================================
   SECCIÓN 8 - MÓDULO ADMIN & MODERACIÓN (Estadísticas, Usuarios, Reportes, Auditoría)
   ================================================================ */

CREATE OR ALTER PROCEDURE [dbo].[sp_Admin_ObtenerEstadisticas]
AS
BEGIN
	SET NOCOUNT ON;
	SELECT 
		(SELECT COUNT(1) FROM dbo.Usuario) AS total_usuarios,
		(SELECT COUNT(1) FROM dbo.Usuario WHERE tipo_perfil = 'INDIVIDUAL') AS total_individuales,
		(SELECT COUNT(1) FROM dbo.Usuario WHERE tipo_perfil = 'GRUPO') AS total_grupos,
		(SELECT COUNT(1) FROM dbo.Usuario WHERE tipo_perfil = 'ESCUELA') AS total_escuelas,
		(SELECT COUNT(1) FROM dbo.Usuario WHERE verificado = 1) AS total_verificados,
		(SELECT COUNT(1) FROM dbo.Publicacion) AS total_publicaciones,
		(SELECT COUNT(1) FROM dbo.OfertaServicio WHERE disponible = 1) AS total_ofertas_activas,
		(SELECT COUNT(1) FROM dbo.SolicitudContratacion WHERE abierta = 1) AS total_solicitudes_abiertas,
		(SELECT COUNT(1) FROM dbo.Evento WHERE fecha_evento >= GETDATE()) AS total_eventos_proximos,
		(SELECT COUNT(1) FROM dbo.Reporte WHERE resuelto = 0) AS total_reportes_pendientes;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Admin_GestionarUsuario]
	@id_admin INT,
	@id_usuario_destino INT,
	@nuevo_estado BIT = NULL,
	@nuevo_verificado BIT = NULL,
	@nuevo_id_rol INT = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		-- Verificar permisos de Admin
		IF NOT EXISTS (
			SELECT 1 FROM dbo.Usuario u 
			INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol 
			WHERE u.id_usuario = @id_admin AND r.nombre = 'ADMIN'
		)
		BEGIN
			SELECT 'ERROR: Solo los administradores pueden realizar esta acción' AS mensaje;
			RETURN;
		END

		UPDATE dbo.Usuario
		SET estado = ISNULL(@nuevo_estado, estado),
			verificado = ISNULL(@nuevo_verificado, verificado),
			id_rol = ISNULL(@nuevo_id_rol, id_rol),
			fecha_actualizacion = GETDATE()
		WHERE id_usuario = @id_usuario_destino;

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_admin, 'ADMIN_MODIFICA_USUARIO', 'Usuario', @id_usuario_destino, 
			CONCAT('Estado: ', ISNULL(CAST(@nuevo_estado AS VARCHAR),'N/C'), ', Verificado: ', ISNULL(CAST(@nuevo_verificado AS VARCHAR),'N/C'), ', Rol: ', ISNULL(CAST(@nuevo_id_rol AS VARCHAR),'N/C')), GETDATE());

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Admin_CrearReporte]
	@id_usuario_reporta INT,
	@tipo_contenido NVARCHAR(30),
	@id_contenido_reportado INT,
	@motivo NVARCHAR(300)
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		IF @tipo_contenido NOT IN ('PUBLICACION', 'USUARIO', 'EVENTO', 'OFERTA', 'SOLICITUD')
		BEGIN
			SELECT -1 AS id_reporte, 'Tipo de contenido inválido' AS mensaje;
			RETURN;
		END

		INSERT INTO dbo.Reporte (tipo_contenido, id_contenido_reportado, id_usuario_reporta, motivo, resuelto, fecha)
		VALUES (@tipo_contenido, @id_contenido_reportado, @id_usuario_reporta, @motivo, 0, GETDATE());

		SELECT SCOPE_IDENTITY() AS id_reporte, 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT -1 AS id_reporte, ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Admin_ObtenerReportes]
	@solo_pendientes BIT = 1
AS
BEGIN
	SET NOCOUNT ON;
	SELECT 
		r.id_reporte, r.tipo_contenido, r.id_contenido_reportado, r.motivo, r.resuelto, r.fecha,
		u.id_usuario AS reportador_id, u.nombre AS reportador_nombre, u.email AS reportador_email
	FROM dbo.Reporte r
	INNER JOIN dbo.Usuario u ON u.id_usuario = r.id_usuario_reporta
	WHERE (@solo_pendientes = 0 OR r.resuelto = 0)
	ORDER BY r.fecha DESC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Admin_ResolverReporte]
	@id_admin INT,
	@id_reporte INT,
	@accion_tomada NVARCHAR(200) = NULL
AS
BEGIN
	SET NOCOUNT ON;
	BEGIN TRY
		-- Verificar permisos
		IF NOT EXISTS (
			SELECT 1 FROM dbo.Usuario u 
			INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol 
			WHERE u.id_usuario = @id_admin AND r.nombre IN ('ADMIN', 'MODERADOR')
		)
		BEGIN
			SELECT 'ERROR: Requiere rol de Moderador o Administrador' AS mensaje;
			RETURN;
		END

		UPDATE dbo.Reporte SET resuelto = 1 WHERE id_reporte = @id_reporte;

		INSERT INTO dbo.LogAuditoria (id_usuario, accion, tabla_afectada, id_registro, detalle, fecha)
		VALUES (@id_admin, 'RESOLVER_REPORTE', 'Reporte', @id_reporte, ISNULL(@accion_tomada, 'Reporte marcado como resuelto'), GETDATE());

		SELECT 'OK' AS mensaje;
	END TRY
	BEGIN CATCH
		SELECT ERROR_MESSAGE() AS mensaje;
	END CATCH
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Admin_ObtenerLogAuditoria]
	@id_usuario INT = NULL,
	@accion NVARCHAR(80) = NULL,
	@limite INT = 100
AS
BEGIN
	SET NOCOUNT ON;
	SELECT TOP (@limite)
		l.id_logauditoria, l.id_usuario, u.nombre AS usuario_nombre, l.accion, l.tabla_afectada, l.id_registro, l.detalle, l.fecha
	FROM dbo.LogAuditoria l
	LEFT JOIN dbo.Usuario u ON u.id_usuario = l.id_usuario
	WHERE (@id_usuario IS NULL OR l.id_usuario = @id_usuario)
		AND (@accion IS NULL OR l.accion LIKE '%' + @accion + '%')
	ORDER BY l.fecha DESC;
END
GO
