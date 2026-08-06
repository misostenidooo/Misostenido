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
