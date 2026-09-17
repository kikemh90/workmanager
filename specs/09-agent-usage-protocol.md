# Agent Usage Protocol - WorkManager

## 1. How to work with the agents

You do not need to configure anything manually.

Just write your request in the general chat.

Then:

- if the request is simple, it may be handled directly;
- if the request benefits from SDD, the orchestrator flow will be used;
- if the request needs specialization, the relevant agent will be invoked.

## 2. What to write

Useful prompts:

- “Especifica primero, no implementes.”
- “Pasa por el Orchestrator.”
- “Refínalo con el Prompt Optimizer.”
- “Haz el plan técnico antes de tocar código.”
- “Valida con el Tester.”

## 3. What happens behind the scenes

The usual flow is:

1. Orchestrator decides the next specialist.
2. The specialist reads the minimum required context.
3. The specialist produces a structured output.
4. The result is reviewed and, if needed, passed to the next agent.

## 4. What to expect in summaries

When work is performed, the summary should mention:

- what was done;
- what files or docs changed;
- which agents were involved;
- whether any decision is still open.

## 5. Agent visibility rule

From now on, task summaries in this project should explicitly name the agents involved whenever an agent was used.

Example:

- “Agents involved: Orchestrator, Technical Planner”
- “Agents involved: Prompt Optimizer, Functional Spec Writer”

## 6. Current operating mode

Current mode:

- SDD documents and agent contracts are in place;
- implementation has not started yet;
- the next steps should still follow the spec-first sequence.
