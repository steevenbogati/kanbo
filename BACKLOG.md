# Backlog (fuera del alcance de la v1)

Ideas que aparecieron al diseñar la v1 y que **no** se van a construir ahora.
Cada una es candidata para la v2.

## Salió del rediseño y del cambio a usuario
- **Cambiar tu propia contraseña desde la app** (hoy la cambia el administrador en Supabase).
- **Cambiar tu nombre o tu usuario desde la app**. El usuario lo define el administrador y
  no se puede editar: es la llave de entrada.
- **Ordenar las tarjetas a mano** dentro de una columna del tablero.
- **Elegir un color por proyecto** para distinguirlos de un vistazo en el tablero.

## Salió de la construcción (fases 2 a 5)
- **Ordenar las tarjetas a mano dentro de una columna** del tablero. Hoy el orden es
  automático: primero las vencidas, luego por prioridad y por fecha de entrega. La
  columna `board_position` ya existe en la base de datos para cuando se quiera hacer.
- **Editar el nombre de un proyecto** después de creado (hoy se archiva y se crea otro).
- **Borrar un proyecto** desde la app (hoy solo se archiva, para no romper el historial).
- **Recuperar la contraseña por correo** desde la pantalla de entrada. Hoy la cambia el
  administrador desde Supabase.
- **Ver y editar el equipo desde la app** (nombres, roles, desactivar cuentas). Hoy se
  hace con `npm run crear-usuario` y desde el panel de Supabase.

## Salió de decisiones de la Fase 0
- **Subtareas / checklists** dentro de una tarea.
- **Etiquetas libres** además de proyecto y prioridad.
- **Menciones (@persona) en comentarios** con su notificación.
- **Editar y borrar comentarios propios con historial** (en la v1 el autor puede editar,
  sin guardar versiones anteriores).
- **Cronómetro real de horas trabajadas** (la v1 mide días entre "en progreso" y "hecho",
  que es lo que pediste).
- **Notificaciones dentro de la app** (campanita) y push al celular. La v1 solo manda correo.
- **Reasignación masiva** y edición en lote desde la vista lista.
- **Adjuntar archivos en comentarios** (en la v1 los adjuntos van a nivel de tarea).
- **Reportes exportables** a Excel/PDF desde el dashboard.
- **Vista calendario** de fechas de entrega.
- **Recurrencias avanzadas**: "cada martes y jueves", "cada 15 días", días hábiles.
  La v1 hace diaria, semanal y mensual.
- **Más de 3 usuarios / invitaciones por correo**. En la v1 los usuarios los creas tú
  desde Supabase.
- **Papelera / restaurar tareas borradas**.
- **Historial completo de cambios** (hoy la bitácora registra solo cambios de estado,
  que es lo que pediste).
- **App móvil nativa**. La v1 es web mobile-first, se instala como acceso directo.
