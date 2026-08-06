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
