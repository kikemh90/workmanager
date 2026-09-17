# Agent System - WorkManager

## Objetivo

Definir un sistema de agentes especialistas para aplicar SDD de forma ordenada, incremental y reusable.

Los contratos operativos reales de cada agente viven en [agents/](../agents/).

## Agente 1 - Orchestrator

Responsabilidad:

- decidir la fase actual;
- seleccionar el siguiente agente;
- preparar el contexto minimo necesario;
- verificar si la salida cumple el criterio de paso.

Entradas:

- estado del proyecto;
- documentos vigentes;
- objetivo del turno.

Salidas:

- instruccion operativa para el agente siguiente;
- lista de documentos a leer;
- criterio de exito del paso.

## Agente 2 - Prompt Optimizer / Spec Refiner

Responsabilidad:

- convertir ideas del usuario en especificaciones claras;
- detectar ambiguedades;
- transformar prompts en requerimientos profesionales y verificables.

Entradas:

- texto libre del usuario;
- restricciones conocidas.

Salidas:

- especificacion refinada;
- lista de dudas;
- riesgos de interpretacion.

## Agente 3 - Functional Spec Writer

Responsabilidad:

- redactar historias, escenarios y criterios de aceptacion.

Salidas:

- especificaciones funcionales por modulo;
- definiciones de comportamiento;
- reglas de negocio.

## Agente 4 - Technical Planner

Responsabilidad:

- traducir la especificacion funcional a arquitectura;
- definir modelo de datos, almacenamiento y componentes.

Salidas:

- especificacion tecnica;
- decisiones de arquitectura;
- trade-offs.

## Agente 5 - Change Planner

Responsabilidad:

- convertir la especificacion tecnica en incrementos pequeños.

Salidas:

- backlog ordenado;
- dependencias;
- plan de implementacion.

## Agente 6 - Implementer

Responsabilidad:

- implementar exactamente el alcance aprobado;
- respetar la arquitectura y el backlog.

Salidas:

- codigo;
- ajustes minimos en docs relacionados.

## Agente 7 - Test Designer / Tester

Responsabilidad:

- definir casos de prueba antes o durante la implementacion;
- validar persistencia, filtros, CRUD y comportamiento PWA.

Salidas:

- bateria de pruebas;
- resultados;
- defectos encontrados.

## Agente 8 - Documentation Keeper

Responsabilidad:

- mantener actualizados los markdown de especificacion, decisiones y backlog.

Salidas:

- documentos alineados con el estado real del proyecto.

## Reglas de orquestacion

1. El Orchestrator nunca implementa directamente si la fase exige especificacion.
2. Ningun agente implementa una capacidad sin criterio de aceptacion.
3. Toda decision relevante debe quedar registrada en markdown.
4. Si aparece una restriccion nueva, se vuelve a la fase de especificacion adecuada.
5. Los agentes leen solo el contexto necesario para evitar ruido y contradicciones.

## Orden recomendado de uso

1. Orchestrator
2. Prompt Optimizer / Spec Refiner
3. Functional Spec Writer
4. Technical Planner
5. Change Planner
6. Implementer
7. Test Designer / Tester
8. Documentation Keeper
