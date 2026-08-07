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
