# Phased Backlog - WorkManager

## Fase A - Fundacion de especificacion

### A1. Definir alcance V1

- modulos incluidos;
- modulos excluidos;
- flujo principal de uso.

### A2. Cerrar preguntas abiertas criticas

- comportamiento de recordatorios en app abierta o activa;
- taxonomia de estados y prioridades;
- datos minimos de proyecto y tarea.

### A3. Aprobar stack tecnico base

- estructura HTML/CSS/JS;
- almacenamiento local;
- estrategia PWA.

## Fase B - Diseno funcional

### B1. Modelo funcional de proyectos

- alta;
- edicion;
- borrado;
- campos obligatorios.

### B2. Modelo funcional de tareas

- alta rapida;
- edicion rapida;
- borrado;
- asignacion;
- prioridad;
- fechas;
- estado.

### B3. Filtros y vistas

- por proyecto;
- por responsable;
- por prioridad;
- por estado;
- por vencimiento.

## Fase C - Diseno tecnico

### C1. Modelo de datos

- colecciones o stores;
- claves;
- indices;
- versionado.

### C2. Arquitectura UI

- layout;
- componentes;
- estado de la aplicacion;
- accesibilidad base.
- dashboard de KPIs;
- navegacion separada para pantalla diaria, diario y configuracion;
- tabla editable inline para tareas;
- diario de clientes, proyectos y entradas;
- persistencia del area activa.

### C3. Estrategia offline y PWA

- manifest;
- service worker;
- cache;
- instalacion.

## Fase D - Implementacion incremental

### D1. Cascaron de aplicacion

- estructura del proyecto;
- pantalla base;
- estilos base.

### D2. Persistencia local

- capa IndexedDB;
- operaciones CRUD.

### D3. Diario de proyecto

- clientes;
- proyectos asociados al cliente;
- entradas de conocimiento con texto libre.

### D4. Tabla de tareas

- alta inline desde la primera fila;
- edicion inline de campos;
- acciones compactas por fila.

### D5. Filtros y prioridades

- filtrado;
- ordenacion;
- vista diaria en tabla;
- dashboard de KPIs.

### D6. Recordatorios

- avisos in-app segun fecha limite y reglas acordadas;
- sin dependencia de backend;
- sin promesa de disparo en segundo plano con la app cerrada.

## Fase E - Validacion

- pruebas funcionales;
- pruebas de persistencia;
- pruebas de instalacion PWA;
- pruebas de comportamiento de filtros;
- validacion de experiencia de uso.
