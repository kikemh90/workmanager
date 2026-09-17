# Open Questions - WorkManager

## Criticas para cerrar pronto

### 1. Recordatorios

Estado: resuelto para V1.

Decision tomada:

- aviso solo dentro de la app cuando se abre o esta activa.

Impacto:

- se mantiene el enfoque PWA estatica en GitHub Pages;
- no hace falta backend para recordatorios;
- la especificacion funcional debera definir como se muestran los avisos vencidos y proximos.

### 2. Modelo de responsables

Estado: resuelto para V1.

Decision tomada:

- una lista libre de nombres por tarea.

Impacto:

- no hace falta catalogo de personas en V1;
- la captura de tareas sigue siendo rapida;
- la normalizacion de responsables quedara para una version futura si hace falta.

### 3. Estados de tarea

Estado: resuelto para V1.

Decision tomada:

- el conjunto predefinido sera: pendiente / en curso / bloqueada / completada;
- el usuario podra reconfigurar manualmente la lista de estados desde una seccion de configuracion.
- un estado podra editarse cambiando su texto visible manteniendo su id interno;
- un estado podra borrarse solo si no tiene tareas asociadas; si tiene tareas, debera desactivarse.

Impacto:

- la UI arranca con valores estandar;
- la estructura mantiene flexibilidad futura sin complicar la captura diaria.

### 4. Prioridades

Estado: resuelto para V1.

Decision tomada:

- alta / media / baja.

Impacto:

- la interfaz sera mas simple para uso personal;
- la importancia visual debera quedar clara en listados y filtros.

### 5. Relacion tarea-proyecto

Estado: resuelto para V1.

Decision tomada:

- una tarea puede existir sin proyecto.

Impacto:

- la captura rapida gana flexibilidad;
- las tareas sueltas podran convivir con tareas agrupadas.

### 6. Proyectos: archivo o borrado

Estado: resuelto para V1.

Decision tomada:

- los proyectos se archivaran o desactivaran en lugar de borrarse de forma dura.
- un proyecto archivado podra reactivarse y editarse de nuevo.

Impacto:

- se reduce el riesgo de perder agrupaciones importantes;
- las tareas historicas permanecen interpretables.

### 7. Recordatorios

Estado: resuelto para V1.

Decision tomada:

- el recordatorio podra configurarse por fecha limite y por recordatorio manual por tarea;
- la aplicacion destacara con colores concretos las tareas proximas a vencer o ya vencidas.
- el umbral por defecto para considerar una tarea "proxima a vencer" sera de 5 dias.

Impacto:

- el sistema de recordatorios gana flexibilidad;
- la urgencia visual debe definirse de forma consistente en toda la interfaz.

### 8. Colores de fecha

Estado: resuelto para V1.

Decision tomada:

- rojo para vencida;
- ámbar para próxima a vencer;
- verde o neutro para normal.

Impacto:

- el usuario puede detectar urgencia rapidamente sin leer demasiado texto.

### 9. Exportacion e importacion

Estado: resuelto para V1.

Decision tomada:

- la aplicacion podra exportar e importar los datos locales en formato JSON.

Impacto:

- el usuario podra hacer copias de seguridad;
- se facilita migrar datos entre navegadores o equipos.
