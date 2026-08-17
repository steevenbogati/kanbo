# Backlog de Kanbo

La versión actual incluye las mejoras de operación recomendadas: tiempo real, checklist,
cronómetro de horas, bloqueos, notificaciones internas, acciones masivas, calendario,
plantillas, duplicado, búsqueda ampliada, reportes, CSV, equipo, presupuesto, botones para
Google Calendar y WhatsApp, y doble factor.

## Para una v3

- Inicio de sesión con recuperación de contraseña por correo dentro de la app.
- Integraciones OAuth completas con Google Drive, Slack y GitHub Issues.
- Aplicación móvil nativa y modo sin conexión.
- Reglas de recurrencia avanzadas y orden manual persistente en el tablero.
- Papelera y restauración de tareas.
- Historial de cambios de todos los campos, no solo de estados.
- Facturación, cobro a clientes y contabilidad.
- Dominio propio para GitHub Pages.

Las cuentas nuevas siguen creándose con `npm run crear-usuario` porque una página estática no
puede guardar la clave secreta de Supabase de forma segura.
