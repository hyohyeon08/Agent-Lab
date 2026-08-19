# Agent Lab

Agent Lab is a personal laboratory for researching AI agents by running,
comparing, and observing different combinations of models and harnesses.

The project uses the following concepts:

```text
Agent = Model + Harness + Environment
Experiment = Agent + Task + Observer + Evaluator
```

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
- `experiments`: Reproducible experiment records and templates.
- `journals`: Human-written research and practice journals.
- `docs/architecture`: Architecture documentation.
- `docs/decisions`: Architecture Decision Records.
- `results`: Processed experiment results.
- `runs/raw`: Unprocessed traces and command output; ignored by Git.

## Experiment Philosophy

Change one variable at a time whenever possible.

- **Model Comparison**: Keep the harness and task fixed; change only the model.
- **Harness Comparison**: Keep the model and task fixed; change only the harness.

Experiments and journals serve different purposes: experiment records capture
reproducible setups and results, while journals capture human observations,
questions, hypotheses, and lessons learned.

## Current Status

**Stage: Agent Lab v0 — Repository Skeleton**

The repository currently contains structure and documentation only. No models,
harnesses, agent loops, integrations, benchmark runners, or measurement
features have been implemented yet.
