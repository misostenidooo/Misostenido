create database MisostenidoDB
GO
USE [MisostenidoDB]
GO

/* ================================================================
   Misostenido - Estructura de Base de Datos (v5)
   Plataforma de promoción y contratación de artistas nicaragüenses.
   ================================================================ */


/* ================================================================
   SECCIÓN 1 - ESTRUCTURA DE TABLAS
   ================================================================ */

CREATE TABLE [dbo].[Rol](
	[id_rol] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](30) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[estado] [bit] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
 CONSTRAINT [PK_Rol] PRIMARY KEY CLUSTERED ([id_rol] ASC),
 CONSTRAINT [UQ_Rol_nombre] UNIQUE NONCLUSTERED ([nombre] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[Permiso](
	[id_permiso] [int] IDENTITY(1,1) NOT NULL,
	[codigo] [nvarchar](50) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
 CONSTRAINT [PK_Permiso] PRIMARY KEY CLUSTERED ([id_permiso] ASC),
 CONSTRAINT [UQ_Permiso_codigo] UNIQUE NONCLUSTERED ([codigo] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[RolPermiso](
	[id_rolpermiso] [int] IDENTITY(1,1) NOT NULL,
	[id_rol] [int] NOT NULL,
	[id_permiso] [int] NOT NULL,
 CONSTRAINT [PK_RolPermiso] PRIMARY KEY CLUSTERED ([id_rolpermiso] ASC),
 CONSTRAINT [UQ_RolPermiso_par] UNIQUE NONCLUSTERED ([id_rol] ASC, [id_permiso] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[Usuario](
	[id_usuario] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](150) NOT NULL,
	[email] [nvarchar](150) NOT NULL,
	[contrasena_hash] [nvarchar](255) NOT NULL,
	[tipo_perfil] [nvarchar](15) NOT NULL,
	[biografia] [nvarchar](500) NULL,
	[ubicacion] [nvarchar](100) NULL,
	[genero_musical] [nvarchar](80) NULL,
	[instrumento] [nvarchar](80) NULL,
	[foto_perfil_url] [nvarchar](300) NULL,
	[email_verificado] [bit] NOT NULL,
	[id_rol] [int] NOT NULL,
	[verificado] [bit] NOT NULL,
	[estado] [bit] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[fecha_actualizacion] [datetime] NULL,
 CONSTRAINT [PK_Usuario] PRIMARY KEY CLUSTERED ([id_usuario] ASC),
 CONSTRAINT [UQ_Usuario_email] UNIQUE NONCLUSTERED ([email] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[GrupoIntegrante](
	[id_grupointegrante] [int] IDENTITY(1,1) NOT NULL,
	[id_grupo] [int] NOT NULL,
	[id_integrante] [int] NOT NULL,
	[rol_en_grupo] [nvarchar](80) NULL,
	[fecha_union] [datetime] NOT NULL,
 CONSTRAINT [PK_GrupoIntegrante] PRIMARY KEY CLUSTERED ([id_grupointegrante] ASC),
 CONSTRAINT [UQ_GrupoIntegrante_par] UNIQUE NONCLUSTERED ([id_grupo] ASC, [id_integrante] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[EscuelaCurso](
	[id_escuelacurso] [int] IDENTITY(1,1) NOT NULL,
	[id_escuela] [int] NOT NULL,
	[nombre_curso] [nvarchar](150) NOT NULL,
	[descripcion] [nvarchar](300) NULL,
	[horario] [nvarchar](150) NULL,
	[precio] [decimal](10, 2) NULL,
	[estado] [bit] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
 CONSTRAINT [PK_EscuelaCurso] PRIMARY KEY CLUSTERED ([id_escuelacurso] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[ContenidoMultimedia](
	[id_contenidomultimedia] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[tipo] [nvarchar](10) NOT NULL,
	[url] [nvarchar](300) NOT NULL,
	[descripcion] [nvarchar](255) NULL,
	[fecha_subida] [datetime] NOT NULL,
 CONSTRAINT [PK_ContenidoMultimedia] PRIMARY KEY CLUSTERED ([id_contenidomultimedia] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[Publicacion](
	[id_publicacion] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[texto] [nvarchar](1000) NULL,
	[fecha_publicacion] [datetime] NOT NULL,
 CONSTRAINT [PK_Publicacion] PRIMARY KEY CLUSTERED ([id_publicacion] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[PublicacionMultimedia](
	[id_publicacionmultimedia] [int] IDENTITY(1,1) NOT NULL,
	[id_publicacion] [int] NOT NULL,
	[tipo] [nvarchar](10) NOT NULL,
	[url] [nvarchar](300) NOT NULL,
	[descripcion] [nvarchar](255) NULL,
	[fecha_subida] [datetime] NOT NULL,
 CONSTRAINT [PK_PublicacionMultimedia] PRIMARY KEY CLUSTERED ([id_publicacionmultimedia] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[PublicacionLike](
	[id_publicacionlike] [int] IDENTITY(1,1) NOT NULL,
	[id_publicacion] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[fecha] [datetime] NOT NULL,
 CONSTRAINT [PK_PublicacionLike] PRIMARY KEY CLUSTERED ([id_publicacionlike] ASC),
 CONSTRAINT [UQ_PublicacionLike_par] UNIQUE NONCLUSTERED ([id_publicacion] ASC, [id_usuario] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[PublicacionComentario](
	[id_publicacioncomentario] [int] IDENTITY(1,1) NOT NULL,
	[id_publicacion] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[texto] [nvarchar](500) NOT NULL,
	[fecha] [datetime] NOT NULL,
 CONSTRAINT [PK_PublicacionComentario] PRIMARY KEY CLUSTERED ([id_publicacioncomentario] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[OfertaServicio](
	[id_ofertaservicio] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[titulo] [nvarchar](150) NOT NULL,
	[descripcion] [nvarchar](1000) NULL,
	[genero_musical] [nvarchar](80) NULL,
	[tarifa_aproximada] [decimal](10, 2) NULL,
	[ubicacion] [nvarchar](100) NULL,
	[disponible] [bit] NOT NULL,
	[fecha_publicacion] [datetime] NOT NULL,
 CONSTRAINT [PK_OfertaServicio] PRIMARY KEY CLUSTERED ([id_ofertaservicio] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[SolicitudContratacion](
	[id_solicitudcontratacion] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[titulo] [nvarchar](150) NOT NULL,
	[descripcion] [nvarchar](1000) NULL,
	[fecha_evento] [date] NULL,
	[presupuesto] [decimal](10, 2) NULL,
	[ubicacion] [nvarchar](100) NULL,
	[abierta] [bit] NOT NULL,
	[fecha_publicacion] [datetime] NOT NULL,
 CONSTRAINT [PK_SolicitudContratacion] PRIMARY KEY CLUSTERED ([id_solicitudcontratacion] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[Postulacion](
	[id_postulacion] [int] IDENTITY(1,1) NOT NULL,
	[id_oferta] [int] NULL,
	[id_solicitud] [int] NULL,
	[id_usuario_emisor] [int] NOT NULL,
	[mensaje] [nvarchar](500) NULL,
	[estado] [nvarchar](15) NOT NULL,
	[fecha] [datetime] NOT NULL,
 CONSTRAINT [PK_Postulacion] PRIMARY KEY CLUSTERED ([id_postulacion] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[ContratacionMultimedia](
	[id_contratacionmultimedia] [int] IDENTITY(1,1) NOT NULL,
	[id_oferta] [int] NULL,
	[id_solicitud] [int] NULL,
	[tipo] [nvarchar](10) NOT NULL,
	[url] [nvarchar](300) NOT NULL,
	[descripcion] [nvarchar](255) NULL,
	[fecha_subida] [datetime] NOT NULL,
 CONSTRAINT [PK_ContratacionMultimedia] PRIMARY KEY CLUSTERED ([id_contratacionmultimedia] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[Evento](
	[id_evento] [int] IDENTITY(1,1) NOT NULL,
	[id_organizador] [int] NOT NULL,
	[titulo] [nvarchar](150) NOT NULL,
	[descripcion] [nvarchar](1000) NULL,
	[tipo_evento] [nvarchar](50) NULL,
	[fecha_evento] [datetime] NOT NULL,
	[ubicacion] [nvarchar](100) NULL,
	[info_inscripcion] [nvarchar](500) NULL,
	[fecha_publicacion] [datetime] NOT NULL,
 CONSTRAINT [PK_Evento] PRIMARY KEY CLUSTERED ([id_evento] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[EventoMultimedia](
	[id_eventomultimedia] [int] IDENTITY(1,1) NOT NULL,
	[id_evento] [int] NOT NULL,
	[tipo] [nvarchar](10) NOT NULL,
	[url] [nvarchar](300) NOT NULL,
	[descripcion] [nvarchar](255) NULL,
	[fecha_subida] [datetime] NOT NULL,
 CONSTRAINT [PK_EventoMultimedia] PRIMARY KEY CLUSTERED ([id_eventomultimedia] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[Seguidor](
	[id_seguidor_rel] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[id_seguidor] [int] NOT NULL,
	[fecha] [datetime] NOT NULL,
 CONSTRAINT [PK_Seguidor] PRIMARY KEY CLUSTERED ([id_seguidor_rel] ASC),
 CONSTRAINT [UQ_Seguidor_par] UNIQUE NONCLUSTERED ([id_usuario] ASC, [id_seguidor] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[LogAuditoria](
	[id_logauditoria] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NULL,
	[accion] [nvarchar](80) NOT NULL,
	[tabla_afectada] [nvarchar](50) NULL,
	[id_registro] [int] NULL,
	[detalle] [nvarchar](500) NULL,
	[fecha] [datetime] NOT NULL,
 CONSTRAINT [PK_LogAuditoria] PRIMARY KEY CLUSTERED ([id_logauditoria] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[Reporte](
	[id_reporte] [int] IDENTITY(1,1) NOT NULL,
	[tipo_contenido] [nvarchar](30) NOT NULL,
	[id_contenido_reportado] [int] NOT NULL,
	[id_usuario_reporta] [int] NOT NULL,
	[motivo] [nvarchar](300) NULL,
	[resuelto] [bit] NOT NULL,
	[fecha] [datetime] NOT NULL,
 CONSTRAINT [PK_Reporte] PRIMARY KEY CLUSTERED ([id_reporte] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[TokenVerificacion](
	[id_tokenverificacion] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[token] [nvarchar](255) NOT NULL,
	[tipo] [nvarchar](20) NOT NULL,
	[usado] [bit] NOT NULL,
	[fecha_expiracion] [datetime] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
 CONSTRAINT [PK_TokenVerificacion] PRIMARY KEY CLUSTERED ([id_tokenverificacion] ASC),
 CONSTRAINT [UQ_TokenVerificacion_token] UNIQUE NONCLUSTERED ([token] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[SesionUsuario](
	[id_sesionusuario] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[refresh_token] [nvarchar](500) NOT NULL,
	[dispositivo] [nvarchar](200) NULL,
	[ip_origen] [nvarchar](50) NULL,
	[revocado] [bit] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[fecha_expiracion] [datetime] NOT NULL,
 CONSTRAINT [PK_SesionUsuario] PRIMARY KEY CLUSTERED ([id_sesionusuario] ASC)
) ON [PRIMARY]
GO


/* ================================================================
   SECCIÓN 2 - VALORES POR DEFECTO
   ================================================================ */

ALTER TABLE [dbo].[Usuario] ADD DEFAULT ((0)) FOR [email_verificado]
GO
ALTER TABLE [dbo].[Usuario] ADD DEFAULT ((0)) FOR [verificado]
GO
ALTER TABLE [dbo].[Usuario] ADD DEFAULT ((1)) FOR [estado]
GO
ALTER TABLE [dbo].[Usuario] ADD DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[Rol] ADD DEFAULT ((1)) FOR [estado]
GO
ALTER TABLE [dbo].[Rol] ADD DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[GrupoIntegrante] ADD DEFAULT (getdate()) FOR [fecha_union]
GO
ALTER TABLE [dbo].[EscuelaCurso] ADD DEFAULT ((1)) FOR [estado]
GO
ALTER TABLE [dbo].[EscuelaCurso] ADD DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[ContenidoMultimedia] ADD DEFAULT (getdate()) FOR [fecha_subida]
GO
ALTER TABLE [dbo].[PublicacionMultimedia] ADD DEFAULT (getdate()) FOR [fecha_subida]
GO
ALTER TABLE [dbo].[EventoMultimedia] ADD DEFAULT (getdate()) FOR [fecha_subida]
GO
ALTER TABLE [dbo].[ContratacionMultimedia] ADD DEFAULT (getdate()) FOR [fecha_subida]
GO
ALTER TABLE [dbo].[Publicacion] ADD DEFAULT (getdate()) FOR [fecha_publicacion]
GO
ALTER TABLE [dbo].[PublicacionLike] ADD DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [dbo].[PublicacionComentario] ADD DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [dbo].[OfertaServicio] ADD DEFAULT ((1)) FOR [disponible]
GO
ALTER TABLE [dbo].[OfertaServicio] ADD DEFAULT (getdate()) FOR [fecha_publicacion]
GO
ALTER TABLE [dbo].[SolicitudContratacion] ADD DEFAULT ((1)) FOR [abierta]
GO
ALTER TABLE [dbo].[SolicitudContratacion] ADD DEFAULT (getdate()) FOR [fecha_publicacion]
GO
ALTER TABLE [dbo].[Postulacion] ADD DEFAULT ('PENDIENTE') FOR [estado]
GO
ALTER TABLE [dbo].[Postulacion] ADD DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [dbo].[Evento] ADD DEFAULT (getdate()) FOR [fecha_publicacion]
GO
ALTER TABLE [dbo].[Seguidor] ADD DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [dbo].[LogAuditoria] ADD DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [dbo].[Reporte] ADD DEFAULT ((0)) FOR [resuelto]
GO
ALTER TABLE [dbo].[Reporte] ADD DEFAULT (getdate()) FOR [fecha]
GO


/* ================================================================
   SECCIÓN 3 - CLAVES FORÁNEAS (RELACIONES)
   ================================================================ */

ALTER TABLE [dbo].[RolPermiso] WITH CHECK ADD CONSTRAINT [FK_RolPermiso_Rol] FOREIGN KEY([id_rol]) REFERENCES [dbo].[Rol] ([id_rol])
GO
ALTER TABLE [dbo].[RolPermiso] CHECK CONSTRAINT [FK_RolPermiso_Rol]
GO
ALTER TABLE [dbo].[RolPermiso] WITH CHECK ADD CONSTRAINT [FK_RolPermiso_Permiso] FOREIGN KEY([id_permiso]) REFERENCES [dbo].[Permiso] ([id_permiso])
GO
ALTER TABLE [dbo].[RolPermiso] CHECK CONSTRAINT [FK_RolPermiso_Permiso]
GO

ALTER TABLE [dbo].[Usuario] WITH CHECK ADD CONSTRAINT [FK_Usuario_Rol] FOREIGN KEY([id_rol]) REFERENCES [dbo].[Rol] ([id_rol])
GO
ALTER TABLE [dbo].[Usuario] CHECK CONSTRAINT [FK_Usuario_Rol]
GO

ALTER TABLE [dbo].[GrupoIntegrante] WITH CHECK ADD CONSTRAINT [FK_Grupo_Usuario] FOREIGN KEY([id_grupo]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[GrupoIntegrante] CHECK CONSTRAINT [FK_Grupo_Usuario]
GO
ALTER TABLE [dbo].[GrupoIntegrante] WITH CHECK ADD CONSTRAINT [FK_Integrante_Usuario] FOREIGN KEY([id_integrante]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[GrupoIntegrante] CHECK CONSTRAINT [FK_Integrante_Usuario]
GO

ALTER TABLE [dbo].[EscuelaCurso] WITH CHECK ADD CONSTRAINT [FK_Curso_Escuela] FOREIGN KEY([id_escuela]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[EscuelaCurso] CHECK CONSTRAINT [FK_Curso_Escuela]
GO

ALTER TABLE [dbo].[Publicacion] WITH CHECK ADD CONSTRAINT [FK_Publicacion_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[Publicacion] CHECK CONSTRAINT [FK_Publicacion_Usuario]
GO

ALTER TABLE [dbo].[PublicacionLike] WITH CHECK ADD CONSTRAINT [FK_Like_Publicacion] FOREIGN KEY([id_publicacion]) REFERENCES [dbo].[Publicacion] ([id_publicacion])
GO
ALTER TABLE [dbo].[PublicacionLike] CHECK CONSTRAINT [FK_Like_Publicacion]
GO
ALTER TABLE [dbo].[PublicacionLike] WITH CHECK ADD CONSTRAINT [FK_Like_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[PublicacionLike] CHECK CONSTRAINT [FK_Like_Usuario]
GO

ALTER TABLE [dbo].[PublicacionComentario] WITH CHECK ADD CONSTRAINT [FK_Comentario_Publicacion] FOREIGN KEY([id_publicacion]) REFERENCES [dbo].[Publicacion] ([id_publicacion])
GO
ALTER TABLE [dbo].[PublicacionComentario] CHECK CONSTRAINT [FK_Comentario_Publicacion]
GO
ALTER TABLE [dbo].[PublicacionComentario] WITH CHECK ADD CONSTRAINT [FK_Comentario_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[PublicacionComentario] CHECK CONSTRAINT [FK_Comentario_Usuario]
GO

ALTER TABLE [dbo].[OfertaServicio] WITH CHECK ADD CONSTRAINT [FK_Oferta_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[OfertaServicio] CHECK CONSTRAINT [FK_Oferta_Usuario]
GO

ALTER TABLE [dbo].[SolicitudContratacion] WITH CHECK ADD CONSTRAINT [FK_Solicitud_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[SolicitudContratacion] CHECK CONSTRAINT [FK_Solicitud_Usuario]
GO

ALTER TABLE [dbo].[Postulacion] WITH CHECK ADD CONSTRAINT [FK_Postulacion_Oferta] FOREIGN KEY([id_oferta]) REFERENCES [dbo].[OfertaServicio] ([id_ofertaservicio])
GO
ALTER TABLE [dbo].[Postulacion] CHECK CONSTRAINT [FK_Postulacion_Oferta]
GO
ALTER TABLE [dbo].[Postulacion] WITH CHECK ADD CONSTRAINT [FK_Postulacion_Solicitud] FOREIGN KEY([id_solicitud]) REFERENCES [dbo].[SolicitudContratacion] ([id_solicitudcontratacion])
GO
ALTER TABLE [dbo].[Postulacion] CHECK CONSTRAINT [FK_Postulacion_Solicitud]
GO
ALTER TABLE [dbo].[Postulacion] WITH CHECK ADD CONSTRAINT [FK_Postulacion_Emisor] FOREIGN KEY([id_usuario_emisor]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[Postulacion] CHECK CONSTRAINT [FK_Postulacion_Emisor]
GO

ALTER TABLE [dbo].[Evento] WITH CHECK ADD CONSTRAINT [FK_Evento_Organizador] FOREIGN KEY([id_organizador]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[Evento] CHECK CONSTRAINT [FK_Evento_Organizador]
GO

ALTER TABLE [dbo].[Seguidor] WITH CHECK ADD CONSTRAINT [FK_Seguidor_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[Seguidor] CHECK CONSTRAINT [FK_Seguidor_Usuario]
GO
ALTER TABLE [dbo].[Seguidor] WITH CHECK ADD CONSTRAINT [FK_Seguidor_Seguidor] FOREIGN KEY([id_seguidor]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[Seguidor] CHECK CONSTRAINT [FK_Seguidor_Seguidor]
GO

ALTER TABLE [dbo].[LogAuditoria] WITH CHECK ADD CONSTRAINT [FK_Log_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario]) ON DELETE SET NULL
GO
ALTER TABLE [dbo].[LogAuditoria] CHECK CONSTRAINT [FK_Log_Usuario]
GO

ALTER TABLE [dbo].[Reporte] WITH CHECK ADD CONSTRAINT [FK_Reporte_Usuario] FOREIGN KEY([id_usuario_reporta]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[Reporte] CHECK CONSTRAINT [FK_Reporte_Usuario]
GO

ALTER TABLE [dbo].[TokenVerificacion] WITH CHECK ADD CONSTRAINT [FK_Token_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[TokenVerificacion] CHECK CONSTRAINT [FK_Token_Usuario]
GO

ALTER TABLE [dbo].[SesionUsuario] WITH CHECK ADD CONSTRAINT [FK_Sesion_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[SesionUsuario] CHECK CONSTRAINT [FK_Sesion_Usuario]
GO

ALTER TABLE [dbo].[ContenidoMultimedia] WITH CHECK ADD CONSTRAINT [FK_Media_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[ContenidoMultimedia] CHECK CONSTRAINT [FK_Media_Usuario]
GO

ALTER TABLE [dbo].[PublicacionMultimedia] WITH CHECK ADD CONSTRAINT [FK_PubMedia_Publicacion] FOREIGN KEY([id_publicacion]) REFERENCES [dbo].[Publicacion] ([id_publicacion])
GO
ALTER TABLE [dbo].[PublicacionMultimedia] CHECK CONSTRAINT [FK_PubMedia_Publicacion]
GO

ALTER TABLE [dbo].[EventoMultimedia] WITH CHECK ADD CONSTRAINT [FK_EventoMedia_Evento] FOREIGN KEY([id_evento]) REFERENCES [dbo].[Evento] ([id_evento])
GO
ALTER TABLE [dbo].[EventoMultimedia] CHECK CONSTRAINT [FK_EventoMedia_Evento]
GO

ALTER TABLE [dbo].[ContratacionMultimedia] WITH CHECK ADD CONSTRAINT [FK_ContratMedia_Oferta] FOREIGN KEY([id_oferta]) REFERENCES [dbo].[OfertaServicio] ([id_ofertaservicio])
GO
ALTER TABLE [dbo].[ContratacionMultimedia] CHECK CONSTRAINT [FK_ContratMedia_Oferta]
GO
ALTER TABLE [dbo].[ContratacionMultimedia] WITH CHECK ADD CONSTRAINT [FK_ContratMedia_Solicitud] FOREIGN KEY([id_solicitud]) REFERENCES [dbo].[SolicitudContratacion] ([id_solicitudcontratacion])
GO
ALTER TABLE [dbo].[ContratacionMultimedia] CHECK CONSTRAINT [FK_ContratMedia_Solicitud]
GO


/* ================================================================
   SECCIÓN 4 - RESTRICCIONES CHECK
   ================================================================ */

ALTER TABLE [dbo].[Usuario] WITH CHECK ADD CONSTRAINT [CK_Usuario_tipo_perfil] CHECK (([tipo_perfil]='INDIVIDUAL' OR [tipo_perfil]='GRUPO' OR [tipo_perfil]='ESCUELA'))
GO
ALTER TABLE [dbo].[Usuario] CHECK CONSTRAINT [CK_Usuario_tipo_perfil]
GO

ALTER TABLE [dbo].[Postulacion] WITH CHECK ADD CONSTRAINT [CK_Postulacion_estado] CHECK (([estado]='PENDIENTE' OR [estado]='ACEPTADA' OR [estado]='RECHAZADA'))
GO
ALTER TABLE [dbo].[Postulacion] CHECK CONSTRAINT [CK_Postulacion_estado]
GO
ALTER TABLE [dbo].[Postulacion] WITH CHECK ADD CONSTRAINT [CK_Postulacion_origen] CHECK (([id_oferta] IS NOT NULL AND [id_solicitud] IS NULL) OR ([id_oferta] IS NULL AND [id_solicitud] IS NOT NULL))
GO
ALTER TABLE [dbo].[Postulacion] CHECK CONSTRAINT [CK_Postulacion_origen]
GO

ALTER TABLE [dbo].[ContenidoMultimedia] WITH CHECK ADD CONSTRAINT [CK_Media_tipo] CHECK (([tipo]='FOTO' OR [tipo]='VIDEO' OR [tipo]='AUDIO'))
GO
ALTER TABLE [dbo].[ContenidoMultimedia] CHECK CONSTRAINT [CK_Media_tipo]
GO

ALTER TABLE [dbo].[PublicacionMultimedia] WITH CHECK ADD CONSTRAINT [CK_PubMedia_tipo] CHECK (([tipo]='FOTO' OR [tipo]='VIDEO'))
GO
ALTER TABLE [dbo].[PublicacionMultimedia] CHECK CONSTRAINT [CK_PubMedia_tipo]
GO

ALTER TABLE [dbo].[EventoMultimedia] WITH CHECK ADD CONSTRAINT [CK_EventoMedia_tipo] CHECK (([tipo]='FOTO' OR [tipo]='VIDEO'))
GO
ALTER TABLE [dbo].[EventoMultimedia] CHECK CONSTRAINT [CK_EventoMedia_tipo]
GO

ALTER TABLE [dbo].[ContratacionMultimedia] WITH CHECK ADD CONSTRAINT [CK_ContratMedia_tipo] CHECK (([tipo]='FOTO' OR [tipo]='VIDEO'))
GO
ALTER TABLE [dbo].[ContratacionMultimedia] CHECK CONSTRAINT [CK_ContratMedia_tipo]
GO
ALTER TABLE [dbo].[ContratacionMultimedia] WITH CHECK ADD CONSTRAINT [CK_ContratMedia_origen] CHECK (([id_oferta] IS NOT NULL AND [id_solicitud] IS NULL) OR ([id_oferta] IS NULL AND [id_solicitud] IS NOT NULL))
GO
ALTER TABLE [dbo].[ContratacionMultimedia] CHECK CONSTRAINT [CK_ContratMedia_origen]
GO

ALTER TABLE [dbo].[TokenVerificacion] WITH CHECK ADD CONSTRAINT [CK_Token_tipo] CHECK (([tipo]='VERIFICACION_EMAIL' OR [tipo]='RESET_PASSWORD'))
GO
ALTER TABLE [dbo].[TokenVerificacion] CHECK CONSTRAINT [CK_Token_tipo]
GO

ALTER TABLE [dbo].[Seguidor] WITH CHECK ADD CONSTRAINT [CK_Seguidor_no_auto] CHECK (([id_usuario] <> [id_seguidor]))
GO
ALTER TABLE [dbo].[Seguidor] CHECK CONSTRAINT [CK_Seguidor_no_auto]
GO

ALTER TABLE [dbo].[Reporte] WITH CHECK ADD CONSTRAINT [CK_Reporte_tipo_contenido] CHECK (([tipo_contenido]='PUBLICACION' OR [tipo_contenido]='USUARIO' OR [tipo_contenido]='EVENTO' OR [tipo_contenido]='OFERTA' OR [tipo_contenido]='SOLICITUD'))
GO
ALTER TABLE [dbo].[Reporte] CHECK CONSTRAINT [CK_Reporte_tipo_contenido]
GO


/* ================================================================
   SECCIÓN 5 - ÍNDICES
   ================================================================ */

CREATE NONCLUSTERED INDEX [IX_Usuario_tipo_perfil] ON [dbo].[Usuario] ([tipo_perfil] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Usuario_rol] ON [dbo].[Usuario] ([id_rol] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Usuario_ubicacion] ON [dbo].[Usuario] ([ubicacion] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Publicacion_usuario] ON [dbo].[Publicacion] ([id_usuario] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Publicacion_fecha] ON [dbo].[Publicacion] ([fecha_publicacion] DESC)
GO
CREATE NONCLUSTERED INDEX [IX_OfertaServicio_genero] ON [dbo].[OfertaServicio] ([genero_musical] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Evento_fecha] ON [dbo].[Evento] ([fecha_evento] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_TokenVerificacion_usuario] ON [dbo].[TokenVerificacion] ([id_usuario] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_SesionUsuario_usuario] ON [dbo].[SesionUsuario] ([id_usuario] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Media_usuario] ON [dbo].[ContenidoMultimedia] ([id_usuario] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_PubMedia_publicacion] ON [dbo].[PublicacionMultimedia] ([id_publicacion] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_EventoMedia_evento] ON [dbo].[EventoMultimedia] ([id_evento] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_ContratMedia_oferta] ON [dbo].[ContratacionMultimedia] ([id_oferta] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_ContratMedia_solicitud] ON [dbo].[ContratacionMultimedia] ([id_solicitud] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_GrupoIntegrante_grupo] ON [dbo].[GrupoIntegrante] ([id_grupo] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_EscuelaCurso_escuela] ON [dbo].[EscuelaCurso] ([id_escuela] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Postulacion_oferta] ON [dbo].[Postulacion] ([id_oferta] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Postulacion_solicitud] ON [dbo].[Postulacion] ([id_solicitud] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Reporte_contenido] ON [dbo].[Reporte] ([tipo_contenido] ASC, [id_contenido_reportado] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_OfertaServicio_usuario] ON [dbo].[OfertaServicio] ([id_usuario] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_SolicitudContratacion_usuario] ON [dbo].[SolicitudContratacion] ([id_usuario] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Evento_organizador] ON [dbo].[Evento] ([id_organizador] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_PublicacionComentario_publicacion] ON [dbo].[PublicacionComentario] ([id_publicacion] ASC)
GO
CREATE NONCLUSTERED INDEX [IX_Seguidor_seguidor] ON [dbo].[Seguidor] ([id_seguidor] ASC)
GO


/* ================================================================
   SECCIÓN 6 - DATOS SEMILLA
   ================================================================ */

INSERT INTO dbo.Rol (nombre, descripcion) VALUES
	('USUARIO', 'Cuenta estándar: individual, grupo o escuela'),
	('MODERADOR', 'Revisa reportes y modera contenido'),
	('ADMIN', 'Acceso completo al panel de administración');
GO

INSERT INTO dbo.Permiso (codigo, descripcion) VALUES
	('PUBLICAR_CONTENIDO', 'Publicar en el feed y subir multimedia al perfil'),
	('PUBLICAR_CONTRATACION', 'Publicar ofertas de servicio o solicitudes'),
	('PUBLICAR_EVENTO', 'Publicar eventos y actividades'),
	('MODERAR_CONTENIDO', 'Revisar reportes y eliminar publicaciones o eventos'),
	('GESTIONAR_USUARIOS', 'Aprobar, suspender o verificar cuentas'),
	('VER_ESTADISTICAS', 'Ver estadísticas generales de uso de la plataforma');
GO

INSERT INTO dbo.RolPermiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso FROM dbo.Rol r, dbo.Permiso p
WHERE r.nombre = 'USUARIO' AND p.codigo IN ('PUBLICAR_CONTENIDO', 'PUBLICAR_CONTRATACION', 'PUBLICAR_EVENTO');
GO

INSERT INTO dbo.RolPermiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso FROM dbo.Rol r, dbo.Permiso p
WHERE r.nombre = 'MODERADOR' AND p.codigo IN ('PUBLICAR_CONTENIDO', 'PUBLICAR_CONTRATACION', 'PUBLICAR_EVENTO', 'MODERAR_CONTENIDO');
GO

INSERT INTO dbo.RolPermiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso FROM dbo.Rol r, dbo.Permiso p
WHERE r.nombre = 'ADMIN';
GO
