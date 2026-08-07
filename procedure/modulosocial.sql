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