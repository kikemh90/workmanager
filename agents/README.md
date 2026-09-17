# WorkManager Agents

Esta carpeta contiene los contratos operativos de los agentes especializados del flujo SDD.

## Orden de uso

1. [orchestrator.md](./orchestrator.md)
2. [prompt-optimizer.md](./prompt-optimizer.md)
3. [functional-spec-writer.md](./functional-spec-writer.md)
4. [technical-planner.md](./technical-planner.md)
5. [change-planner.md](./change-planner.md)
6. [implementer.md](./implementer.md)
7. [tester.md](./tester.md)
8. [documentation-keeper.md](./documentation-keeper.md)

## Regla de operacion

El chat principal actua como coordinador. Cuando una fase requiera trabajo especializado, se lanza el agente correspondiente con el contexto minimo necesario y se valida su salida antes de pasar al siguiente paso.
