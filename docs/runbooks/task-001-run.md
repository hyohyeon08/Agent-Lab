# TASK-001 실행 안내

## 1. 사전 조건

- Agent Lab 작업 트리가 깨끗해야 한다.
- `booking-scheduler`의 공개 테스트와 타입 검사가 통과해야 한다.
- 외부 평가는 인접 예약 사례 2개 때문에 실패해야 한다.

## 2. 실행용 독립 저장소 생성

Agent Lab 루트에서 실행한다.

```bash
task_fixture_commit=$(git log -1 --format=%H -- benchmarks/fixtures/booking-scheduler)
task_run_root="$PWD/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler"
test ! -e "$task_run_root"
mkdir -p "$task_run_root"
git archive "$task_fixture_commit":benchmarks/fixtures/booking-scheduler | tar -x -C "$task_run_root"
git -C "$task_run_root" init
git -C "$task_run_root" add .
git -C "$task_run_root" -c user.name="Agent Lab" -c user.email="agent-lab@example.invalid" commit -m "baseline: TASK-001 broken state"
(cd "$task_run_root" && npm ci)
npm --prefix "$task_run_root" test
npm --prefix "$task_run_root" run typecheck
git -C "$task_run_root" rev-parse HEAD
```

마지막에 출력된 SHA를 `run.md`의 `fixture.workspace_start_commit`에 기록한다. `task_fixture_commit` 값은 `study.yaml`과 `run.md`의 `fixture.source_commit`에 기록한다.

## 3. 새 Codex 작업 생성

1. `runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler` 폴더만 로컬 프로젝트로 연다.
2. 화면에 표시되는 Model, reasoning effort, plugin과 skill 정보를 `study.yaml`과 `run.md`에 기록한다.
3. 새 작업의 task ID와 URL을 `run.md`의 `source_task.id`, `source_task.url`에 기록한다.
4. `prompt.md`의 본문만 새 작업에 전달한다.
5. 구현 힌트, 파일 위치, 테스트 작성 순서를 추가로 알려주지 않는다.
6. 권한과 환경 문제 외에는 개입하지 않는다.

## 4. 완료 즉시 결과 고정

Agent가 완료를 선언하면 추가 요청을 보내지 않는다.

```bash
task_run_root="$PWD/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler"
task_results_root="$PWD/experiments/STUDY-0001/runs/RUN-0001"
task_start_commit=$(git -C "$task_run_root" rev-list --max-parents=0 HEAD)
git -C "$task_run_root" add -N .
git -C "$task_run_root" diff --binary "$task_start_commit" --output="$task_results_root/diff.patch"
git -C "$task_run_root" diff --stat "$task_start_commit"
```

`git add -N .`은 새 파일의 내용도 diff에 포함하기 위한 intent-to-add 표시이며 작업 파일을 수정하지 않는다. Agent의 최종 응답은 `final-response.md`에 그대로 저장한다.

세션 JSONL을 고정한 뒤 [실행 정량 지표 정의](../metrics.md)에 따라
`time_to_first_action_ms`, 모델 요청 프록시, 논리/상위 도구 호출 수와 분류,
Skill 노출·실사용, 실패·재시도, 종료 이유를 계산해 `run.md` frontmatter와
정량 지표 표에 기록한다. 내부 요청 수나 실제 청구액처럼 Trace가 직접
제공하지 않는 값은 반드시 프록시 또는 unavailable로 표시한다.

## 5. 독립 평가

```bash
task_run_root="$PWD/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler"
npm --prefix "$task_run_root" test
npm --prefix "$task_run_root" run typecheck
npm run evaluate:task-001 -- --candidate "$task_run_root"
```

결과를 `evaluation.yaml`에 기록하고 다음 항목을 수동 검토한다.

- 사용자 제보를 재현하는 회귀 테스트를 추가했는가?
- 테스트와 구현이 특정 시각 `10:00`에만 맞춰져 있지 않은가?
- 실제 중복 예약 방지 동작을 유지하는가?
- 관련 없는 파일이나 지나치게 많은 코드를 수정하지 않았는가?
- Agent가 보고한 검증과 평가 Agent가 독립 실행한 검증을 구분해 기록했는가?

추가된 테스트만 고장 난 기준 구현에 적용해 실제 결함을 탐지하는지 확인할 수
있다. 이 검사는 테스트 결과물의 유효성을 보는 사후 평가이며, 관찰 대상
Agent에게 TDD 순서나 테스트 우선 구현을 요구하는 기준이 아니다.

외부 평가가 실패해도 같은 Agent 작업을 다시 열지 않는다.

## 6. 오염 판단

다음 중 하나라도 발생하면 `contaminated: true`로 기록한다.

- Agent가 실행 공간 밖의 평가기, 정답 패치 또는 설계 문서를 읽었다.
- 사람이 결함 위치나 수정 방법에 관한 힌트를 제공했다.
- 실행 중 Agent 설정을 변경했다.
- 실제 시작 상태가 사전 검증한 상태 또는 기록한 시작 커밋과 다르다.

권한 승인이나 환경 복구도 사람 개입 표에 시점, 이유, 전달 내용을 기록하되 자동으로 오염으로 판정하지 않는다. 오염된 Trace는 학습 자료로 남길 수 있지만 정식 연구 결과에는 포함하지 않는다.

## 7. 관찰 기록 작성

새 Codex 작업에 표시된 메시지, 명령, 파일 읽기·수정, 테스트 출력만 근거로 `run.md`의 사실 기반 행동 표를 순서대로 작성한다. 행동 유형은 `inspect`, `test`, `edit`, `command`, `communicate` 중 하나를 사용한다. 숨겨진 사고 과정을 추정하거나 제공되지 않은 정확한 시간과 token 수를 만들어내지 않는다.

사실 표를 먼저 완성한 뒤 별도 해석 절에 유용했던 행동, 위험하거나 불필요했던 행동, 실패 후 복구, 예상과 달랐던 점, 한계, 다음 질문을 작성한다. 사람 개입은 사실 표와 별도의 사람 개입 표에도 남긴다.

해석에서는 관찰자가 사용하는 플러그인이나 개발 방법론의 선호를 배제한다.
테스트 실행 시점과 편집 순서는 사실로 남길 수 있지만, 과제가 요구하지 않은
TDD·계획 방식·특정 도구 사용 여부를 장점이나 약점으로 판정하지 않는다.
