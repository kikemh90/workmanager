# WorkManager

WorkManager es una PWA ligera para seguimiento personal de proyectos y tareas, pensada para publicarse en GitHub Pages y guardar los datos localmente en el equipo del usuario.

## Estado actual

Fase actual: implementacion incremental con enfoque SDD (Spec-Driven Development).

Estado del producto:

- esqueleto PWA completado;
- capa local IndexedDB completada;
- gestion de tareas completada e integrada en tabla editable;
- filtros y vistas principales completados.
- personalización de estados completada.
- rediseño de navegación y pantallas completado.
- dashboard de KPIs añadido.
- gestor de clientes y proyectos añadido.
- diario de conocimiento conectado al catalogo compartido de proyectos.
- tabla principal compactada con ordenación por cabeceras.
- modo global de edición para la tabla de tareas.
- mostrar/ocultar completadas y recordatorio editable por tarea.
- compactacion de la interfaz para ganar espacio vertical y simplificar la navegacion.
- modal de nuevo registro para Diario con carga de proyecto compartido y filtro por texto.
- marcador visual de "Mi dia" con estrella clickable por tarea.
- filtro rapido "Mi dia" para mostrar solo tareas destacadas con estrella.
- ordenacion visual priorizando automaticamente arriba las tareas marcadas con estrella.
- exportacion e importacion JSON para migrar o respaldar los datos locales entre origenes del navegador.
- selector de tarea `Cliente - Proyecto` alineado visualmente con Diario.
- responsable por defecto `Kike` al crear nuevas tareas.

## Objetivo de producto

La aplicacion debe permitir:

- dar de alta clientes y proyectos desde Gestor;
- crear, editar y borrar tareas rapidamente desde la tabla diaria;
- alternar entre lectura y edicion de la tabla sin ver inputs permanentes;
- asociar tareas a proyectos del catalogo compartido o dejarlas sin proyecto;
- asignar responsable;
- establecer prioridad;
- indicar fecha limite;
- ajustar manualmente la fecha de recordatorio calculada a 5 dias del vencimiento;
- ordenar tareas por vencimiento, prioridad y estado;
- aplicar filtros utiles;
- revisar prioridades personales de forma simple;
- crear entradas de Diario vinculadas a proyectos existentes o sin proyecto;
- filtrar Diario por proyecto y buscar por texto dentro del contenido;
- separar dashboard, tareas, gestor, diario y configuración.
- disponer de un dashboard compacto con KPIs.
- visualizar las tareas diarias en una tabla tipo Excel.
- destacar tareas concretas como foco del dia sin alterar su prioridad funcional.
- mover o restaurar los datos locales entre `localhost` y GitHub Pages mediante archivos JSON.

## Restricciones base

- despliegue en GitHub Pages;
- sin backend potente en la primera fase;
- persistencia local en el navegador del equipo corporativo;
- experiencia sencilla, ligera y rapida;
- PWA instalable.

## Documentacion inicial

- [00-product-vision.md](./specs/00-product-vision.md)
- [01-sdd-methodology.md](./specs/01-sdd-methodology.md)
- [02-agent-system.md](./specs/02-agent-system.md)
- [03-phased-backlog.md](./specs/03-phased-backlog.md)
- [04-open-questions.md](./specs/04-open-questions.md)
- [05-functional-spec.md](./specs/05-functional-spec.md)
- [06-technical-spec.md](./specs/06-technical-spec.md)
- [07-change-plan.md](./specs/07-change-plan.md)
- [08-agent-runbooks.md](./specs/08-agent-runbooks.md)
- [09-agent-usage-protocol.md](./specs/09-agent-usage-protocol.md)

## Agentes operativos

- [agents/](./agents/)

## Estructura funcional actual

- **Dashboard**: KPIs compactos por prioridad, proyecto y vencimiento.
- **Tareas**: tabla principal tipo Excel con filtros, ordenacion por cabeceras incluyendo `Cliente - Proyecto`, modo edicion global, columna `Cliente - Proyecto` coherente con Diario, responsable por defecto `Kike`, colores de prioridad y urgencia de vencimiento con warning amber/red, ocultacion por defecto de tareas completadas y marcador de estrella para `Mi dia`.
- **Gestor**: alta y mantenimiento de clientes y proyectos compartidos.
- **Diario**: registro de conocimiento con selector de proyecto opcional, columna `Cliente - Proyecto`, filtro por proyecto y buscador en contenido, ademas de modal de alta rapida para nuevas entradas.
- **Configuración**: mantenimiento del catalogo de estados de tarea.
- **Configuración**: mantenimiento del catalogo de estados de tarea y herramientas de exportacion/importacion JSON.
- **UX compacta**: banner simplificado, navegacion agrupada, eliminacion de cards redundantes y pantalla de tareas mas densa y legible.
