# Agent Lab

Agent Lab is a personal laboratory for learning how AI agents behave. It uses
small, reproducible coding tasks to observe how an agent explores a repository,
edits code, uses tools, responds to failure, and decides that its work is done.

Agent Lab does not ask only, "Which agent is best?" It asks:

> Under which conditions does an agent perform better, what does that
> performance cost, and which part of the agent explains the difference?

The immediate goal is not to build a general benchmark platform. The first
goal is to develop the habit and vocabulary needed to observe one agent well.

The project uses the following concepts:

```text
Agent = Model + Harness + Environment
```

A model supplies capabilities, a harness shapes how those capabilities are
used, and an environment provides the repository, filesystem, shell, and other
tools. During a run, an observer records the agent's visible behavior and an
evaluator checks the resulting work.

## Research Loop

Agent Lab is used as a repeating research loop:

```text
Observation
    ↓
Question
    ↓
Hypothesis
    ↓
Study
    ↓
Interpretation
    ↓
Next Question
```

The main units are:

- **Study**: The complete investigation of one research question.
- **Condition**: One controlled setup within a study.
- **Run**: One agent attempting one task under one condition.
- **Trace**: The observable actions and events produced during a run.
- **Evaluation**: The evidence used to judge the resulting work.
- **Journal**: The researcher's observations, interpretation, and changes of
  mind.

The project begins with qualitative observation. Comparison and automation are
introduced only after real runs show why they are needed.

## Research Questions

1. How much does a harness improve model performance?
2. Does harness utility decrease as models become stronger?
3. How much additional token usage and latency does each harness introduce?
4. How do different models behave under the same harness?
5. How do different harnesses change the behavior of the same model?
6. Can a smaller model with a strong harness outperform a larger model with a minimal harness?
7. Which Agent behaviors correlate with successful task completion?

## Repository Structure

- `src/models`: Model provider communication adapters.
- `src/harnesses`: Agent harness implementations and adapters.
- `src/observers`: Execution events and traces.
- `src/evaluators`: Result evaluation such as tests, lint, and diffs.
- `src/runners`: Model × Harness × Task experiment execution.
- `src/core`: Shared domain types and interfaces when they are actually needed.
- `benchmarks`: Task definitions and benchmark fixtures.
- `configs`: Model and harness execution settings.
- `experiments`: Reproducible study records and templates.
- `journals`: Human-written research and practice journals.
- `docs/architecture`: Architecture documentation.
- `docs/decisions`: Architecture Decision Records.
- `results`: Processed experiment results.
- `runs/raw`: Unprocessed traces and command output; ignored by Git.

## Controlled Comparison Philosophy

Change one variable at a time whenever possible.

- **Model Comparison**: Keep the harness and task fixed; change only the model.
- **Harness Comparison**: Keep the model and task fixed; change only the harness.

Study records and journals serve different purposes: study records capture
reproducible setups and results, while journals capture human observations,
questions, hypotheses, and lessons learned.

See [the research plan](docs/research-plan.md) for the phased roadmap and
[the fixture guide](benchmarks/fixtures/README.md) for the first observation
task.

## Current Status

**Stage: Agent Lab v0 — First Observation**

The repository currently contains structure and documentation only. The next
milestone is a small TypeScript fixture with one deliberately introduced bug,
followed by one manually reviewed run using a fixed Codex agent. No model or
harness comparison is planned until this observation loop has been completed.
