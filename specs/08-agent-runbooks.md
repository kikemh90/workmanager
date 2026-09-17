# Agent Runbooks - WorkManager

## 1. Shared operating rules

- every agent must work from the smallest sufficient context;
- every output must be actionable;
- if a decision is missing, the agent must return a question instead of guessing;
- documentation changes must reflect the current state of the spec;
- implementation agents only act after the relevant spec gate is closed.

The concrete agent contracts live in [agents/](../agents/).

## 2. Orchestrator

Purpose:

- choose the next phase;
- assign the right specialist;
- pass the minimum context needed;
- verify the output against the phase gate.

Required context:

- [README.md](./README.md);
- current phase spec;
- latest decision log or open questions;
- current backlog and dependency state.

Output format:

- current phase;
- selected specialist;
- exact context to read;
- task objective;
- acceptance gate for the response.

## 3. Prompt Optimizer / Spec Refiner

Purpose:

- convert raw user intent into crisp requirements;
- identify ambiguity and hidden constraints.

Required context:

- user request;
- product vision;
- open questions.

Output format:

- refined request;
- assumptions made;
- questions still open;
- risk notes.

## 4. Functional Spec Writer

Purpose:

- turn refined requirements into user-visible behavior.

Required context:

- product vision;
- open questions;
- current functional spec;
- applicable backlog section.

Output format:

- functional scenarios;
- acceptance criteria;
- out-of-scope items;
- UI behavior notes.

## 5. Technical Planner

Purpose:

- convert functional behavior into architecture and data design.

Required context:

- functional spec;
- product vision;
- change backlog;
- current technical spec.

Output format:

- data model changes;
- storage design;
- UI architecture decisions;
- validation strategy additions.

## 6. Change Planner

Purpose:

- split the approved design into small implementation steps.

Required context:

- technical spec;
- functional spec;
- current backlog.

Output format:

- ordered increments;
- dependencies;
- definition of done for each increment;
- suggested agent assignment.

## 7. Implementer

Purpose:

- make the smallest code change that satisfies the approved step.

Required context:

- current step from the change plan;
- functional spec sections for the step;
- technical spec sections for the step;
- relevant tests or validation checklist.

Output format:

- changed files;
- behavior delivered;
- anything that still needs validation.

## 8. Tester

Purpose:

- validate behavior against the spec.

Required context:

- step definition;
- acceptance criteria;
- implementation diff or summary.

Output format:

- test cases;
- pass/fail result;
- defects;
- regression risk.

## 9. Documentation Keeper

Purpose:

- keep the spec set coherent as the project evolves.

Required context:

- all changed spec documents;
- current backlog;
- validation results.

Output format:

- updated documents;
- list of reconciled decisions;
- stale references found and fixed.

## 10. Recommended delegation chain

1. Orchestrator
2. Prompt Optimizer / Spec Refiner
3. Functional Spec Writer
4. Technical Planner
5. Change Planner
6. Implementer
7. Tester
8. Documentation Keeper
