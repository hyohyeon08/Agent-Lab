# Research Plan

## Purpose

Agent Lab exists to develop a practical understanding of how coding agents
behave. Its primary output is not a leaderboard. Its outputs are better
questions, testable hypotheses, reusable observation methods, and evidence
that can eventually guide agent and harness design.

The project starts by observing one fixed agent. Only after the observation
method becomes useful will the lab compare models, harnesses, or inference
environments.

## Guiding Principles

1. **Observe behavior, not hidden thought.** Record visible actions such as
   file reads, edits, tool choices, tests, retries, and recovery from failure.
2. **Finish a research loop before adding infrastructure.** A manual but
   complete study is more valuable than an unfinished automation platform.
3. **Change one variable at a time.** Controlled comparisons must keep the
   task, environment, and all unrelated agent settings fixed.
4. **Separate observation from interpretation.** A trace records what
   happened; a journal records what the researcher thinks it means.
5. **Treat failure as research material.** Failed exploration, incorrect
   edits, tool errors, context loss, and over-editing are useful observations.
6. **Automate repeated pain.** Build a runner, event schema, database, or
   dashboard only when completed studies demonstrate a concrete need.

## Research Units

Agent Lab uses the following terms consistently:

- A **research question** states what the researcher wants to understand.
- A **study** investigates one research question.
- A **condition** defines one controlled agent and task setup.
- A **run** is one attempt by one agent on one task under one condition.
- A **trace** records the observable events of a run.
- An **evaluation** judges the result using tests, type checks, lint, and the
  resulting diff where applicable.
- An **analysis** interprets evidence across runs.
- A **journal** records observations, uncertainty, changes of mind, and the
  next question.

These distinctions prevent a single run from being confused with the larger
study that contains it.

## Phased Roadmap

### Phase 1: Observe One Agent

Keep the agent fixed and watch how it works on small, reproducible bug-fix
tasks. Review traces manually and develop an initial vocabulary for exploration,
editing, testing, failure, and recovery behavior.

Deliverables:

- One small TypeScript fixture.
- One deliberately introduced bug with an objective evaluator.
- One run using a fixed Codex agent.
- One manually written observation record.
- One journal entry describing what was expected, what was observed, and what
  question emerged.

### Phase 2: Observe Variation Within One Agent

Repeat a useful task with the same agent and unchanged conditions. Determine
which behaviors are stable and which vary between runs. Do not interpret a
single trajectory as the permanent character of an agent.

Deliverables:

- Repeated runs from the same clean starting state.
- A comparison of trajectories without changing the agent.
- A first draft of the behavior and failure taxonomy.

### Phase 3: Run a Controlled Comparison

Change one component only after the fixture, trace, and evaluator have proved
useful. A first comparison may change the model or introduce one small harness
behavior, but not both.

Deliverables:

- One explicit hypothesis.
- Two clearly defined conditions.
- Multiple repetitions under each condition.
- An analysis that reports uncertainty and avoids causal claims unsupported by
  the controls.

### Phase 4: Isolate Harness Behaviors

Use a controllable minimal harness to test individual mechanisms such as
planning before editing, context summarization, or failure recovery. Treat
complete products such as Codex or Claude Code as black-box agents unless their
model, prompts, tools, and orchestration can actually be controlled.

Deliverables:

- Small harness variants that differ by one behavior.
- Ablation studies that explain which behavior changes a trajectory.
- Behavior metrics promoted from patterns first found through manual review.

### Phase 5: Apply the Evidence

Once enough studies exist, use the evidence to choose agents for different
classes of work. Consider success, latency, token and compute cost, diff quality,
and human intervention. Routing policy is a later research output, not an
initial product requirement.

## First-Month Success Criteria

The first month succeeds when the research loop becomes a habit. A reasonable
target is:

- Complete at least two small studies.
- Read and annotate 20 to 30 traces manually.
- Draft an initial behavior and failure taxonomy.
- Write a journal entry each week.
- Turn at least one observation into a testable follow-up hypothesis.

These are learning targets rather than statistical guarantees. Early studies
may be qualitative and small.

## Current Non-Goals

The following work is deliberately deferred:

- A public leaderboard.
- A dashboard or web application.
- A database or event bus.
- A general plugin system.
- Large benchmark imports.
- Automatic agent routing.
- Broad model and harness support.
- Premature metrics for behavior patterns that have not yet been observed.

## First Work Sequence

The first milestone is one complete observation loop, not three prebuilt tasks.
Work proceeds in this order:

1. Record the initial exploratory question: "How does one fixed Codex agent
   investigate and repair a small TypeScript bug, and which visible behaviors
   are useful to observe?"
2. Define a lightweight manual observation record.
3. Create a small TypeScript fixture project.
4. Introduce one small bug and write Task 001 without revealing its solution.
5. Add an evaluator that distinguishes the clean baseline, the broken starting
   state, and a correct repair.
6. Make the broken starting state reproducible and easy to reset.
7. Record the date, fixture commit, available agent identifiers, environment,
   and task prompt before the run.
8. Run one fixed Codex agent on Task 001.
9. Review the full visible trajectory and write the observation record.
10. Write a journal entry capturing expectations, surprises, interpretation,
   limitations, and the next question.
11. Decide whether the evidence calls for Task 002, a repeated run, or a change
   to the observation format.

The lab should not build Task 002 until Task 001 has completed this entire
cycle.

## Decision Rule for New Features

Before adding infrastructure, ask:

> Which completed observation or study demonstrated that this feature is
> necessary?

If there is no concrete answer, defer the feature and run the next experiment.
