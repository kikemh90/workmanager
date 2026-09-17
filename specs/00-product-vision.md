# Product Vision - WorkManager

## 1. Problema

El usuario necesita una herramienta personal de seguimiento de trabajo que sea mas flexible que Microsoft To Do y mas ligera que Excel o OneNote.

## 2. Resultado deseado

Una PWA personal, accesible por URL y tambien instalable, que permita gestionar proyectos y tareas con rapidez y con los datos guardados localmente en el navegador del equipo.

## 3. Usuarios objetivo

### Usuario principal

- profesional que gestiona su propio trabajo;
- necesita visibilidad de prioridades y vencimientos;
- quiere control total sobre la estructura de datos y la interfaz.

## 4. Capacidades candidatas de la V1

- gestion de proyectos;
- gestion de tareas;
- responsable por tarea;
- prioridad;
- fecha limite;
- recordatorios dentro de la app al abrirla o mantenerla activa;
- estado;
- filtros por proyecto, responsable, prioridad y estado;
- ordenacion por urgencia o prioridad;
- vista de hoy, proximos vencimientos y atrasadas;
- persistencia local;
- instalacion como PWA.

## 5. Requisitos no funcionales iniciales

- carga rapida;
- interfaz clara;
- baja friccion al crear y editar tareas;
- funcionamiento sin backend dedicado;
- datos aislados al navegador/dispositivo del usuario;
- mantenimiento simple.

## 6. Arquitectura objetivo inicial

Arquitectura recomendada para validar en especificacion:

- HTML, CSS y JavaScript;
- Web App Manifest;
- Service Worker;
- IndexedDB para persistencia principal;
- despliegue estatico en GitHub Pages.

## 7. Decision tecnica preliminar

IndexedDB es la opcion base recomendada frente a localStorage porque:

- modela mejor proyectos y tareas;
- escala mejor;
- soporta consultas y migraciones de datos con mas orden;
- reduce el riesgo de limites practicos demasiado bajos.

## 8. Riesgos conocidos

### Recordatorios

Los recordatorios en una PWA estatica sin backend ni app nativa tienen limitaciones reales:

- no existe un mecanismo universal y fiable para programar notificaciones futuras en segundo plano en todos los navegadores;
- algunas capacidades dependen de soporte del navegador y politicas corporativas;
- la experiencia puede variar entre navegador web y PWA instalada.

Decision actual para V1:

- los recordatorios seran avisos dentro de la app cuando esta se abra o permanezca activa;
- no se promete envio fiable en segundo plano con la app cerrada.

## 9. Fuera de alcance inicial

- multiusuario real;
- sincronizacion cloud;
- autenticacion compleja;
- integraciones con Outlook, Teams o Microsoft Graph;
- permisos avanzados;
- reporting corporativo.
