# Observation Fixtures

Fixtures are small, reproducible repositories used to observe agent behavior.
They are research instruments, not collections of trick questions. A fixture
should be realistic enough to require repository exploration while remaining
small enough that a human can understand the complete trace.

## Fixture Requirements

Every observation fixture must provide:

- A small, self-contained codebase.
- A documented toolchain and deterministic setup command.
- A clean baseline known to pass its evaluator.
- A reproducible broken starting state.
- A task prompt that describes the desired behavior without disclosing the
  implementation or root cause.
- An evaluator that fails on the broken state and passes on a valid repair.
- A reset procedure that restores exactly the same starting state.
- A place to record fixture assumptions and known limitations.

The visible tests may help the agent understand expected behavior, but the
evaluation must also detect superficial or overfitted repairs when practical.
The fixture should avoid unrelated complexity, flaky dependencies, network
requirements, and ambiguous product decisions.

## First Fixture

The first fixture will be a small TypeScript project containing one deliberately
introduced bug. Task 001 will be a bug fix because it provides a concrete
failure, an observable investigation path, and an objective completion signal.

The first fixture should require the agent to inspect more than one relevant
file, but it should not require framework expertise or a broad architectural
change. The initial task should be solvable through repository evidence rather
than outside knowledge.

The first run keeps the following condition fixed:

- Agent: the current Codex agent.
- Model and harness settings: unchanged during the observation.
- Environment: the same fixture, tools, and broken starting state.
- Repetitions: one initial run.
- Review: manual trace inspection and manual journaling.

Before the run, record the date, fixture commit, exact task prompt, environment,
and any model or harness identifier exposed by the agent. If an internal detail
is unavailable, record it as unknown instead of inferring it.

This run does not compare agents and does not support performance ranking. Its
purpose is to learn what actions are worth recording and what questions the
trajectory creates.

## Initial Observation Record

The first run should answer these questions without attempting to score every
behavior numerically:

1. What did the agent inspect first, and why might that have been useful?
2. When did the agent form and test its first working hypothesis?
3. When did it make the first edit?
4. When did it first run the evaluator?
5. Which reads, edits, or tests were repeated?
6. How did behavior change after a failed command or test?
7. What evidence did the agent use to declare completion?
8. Which actions appeared useful, unnecessary, or risky?
9. What cannot be concluded from this single run?
10. Which new question should guide the next run or fixture?

## After Task 001

Do not automatically create a large suite. Review the first trace and choose
one evidence-driven next step:

- Repeat Task 001 to observe within-agent variation.
- Create Task 002 to observe the same behavior in a different bug.
- Revise the observation record because important behavior was missed.
- Refine the evaluator because completion was ambiguous.

Automation begins only after this manual process exposes repeated work that is
both costly and well understood.
