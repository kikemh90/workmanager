# SDD Methodology - WorkManager

## Principio rector

No se implementa una capacidad hasta que exista una especificacion suficiente para construirla y validarla.

## Fases

### Fase 0 - Descubrimiento

Objetivo:

- entender el problema;
- capturar restricciones;
- identificar riesgos.

Entregables:

- vision de producto;
- preguntas abiertas;
- restricciones tecnicas.

### Fase 1 - Especificacion funcional

Objetivo:

- definir comportamiento esperado por capacidad.

Entregables:

- historias o escenarios de uso;
- reglas funcionales;
- criterios de aceptacion;
- decisiones de alcance para V1.

### Fase 2 - Especificacion tecnica

Objetivo:

- decidir arquitectura y modelo de datos.

Entregables:

- modelo de dominio;
- decisiones de almacenamiento;
- estrategia PWA;
- estrategia de recordatorios;
- estrategia de pruebas.

### Fase 3 - Plan de cambio

Objetivo:

- dividir el trabajo en incrementos pequenos y verificables.

Entregables:

- backlog priorizado;
- orden de implementacion;
- definicion de done por incremento.

### Fase 4 - Implementacion

Objetivo:

- construir solo lo ya especificado.

Reglas:

- cambios pequenos;
- pruebas dirigidas al comportamiento;
- documentacion actualizada con cada incremento.

### Fase 5 - Verificacion

Objetivo:

- validar funcionalidad, UX basica y persistencia local.

Entregables:

- checklist de pruebas;
- evidencia de validacion;
- incidencias y ajustes.

## Puertas de salida

No se pasa de fase si falta alguno de estos minimos:

- Fase 0 -> 1: problema y restricciones claros;
- Fase 1 -> 2: alcance V1 acordado;
- Fase 2 -> 3: decisiones tecnicas criticas resueltas;
- Fase 3 -> 4: backlog priorizado y listo;
- Fase 4 -> 5: implementacion estable con pruebas basicas.

## Artefactos vivos

Los siguientes documentos se mantienen actualizados durante el proyecto:

- vision de producto;
- decisiones abiertas;
- catalogo de agentes;
- backlog;
- criterios de aceptacion;
- notas de validacion.
