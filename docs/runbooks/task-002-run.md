# TASK-002 실행 안내

## 1. 사전 조건

- Agent Lab 작업 트리가 깨끗해야 한다.
- `inventory-reservation`의 공개 테스트 6개와 타입 검사가 통과해야 한다.
- 외부 평가는 중복 취소 재고 사례 1개만 실패하고 나머지 8개는 통과해야 한다.
- 실행마다 같은 `fixture.source_commit`에서 독립 저장소를 새로 만든다.

## 2. 실행용 독립 저장소 생성

Agent Lab 루트에서 실행한다. 아래 예시는 `RUN-0001`이며 반복 실행에서는 Run ID만
바꾼다.

```bash
task_fixture_commit=$(git log -1 --format=%H -- benchmarks/fixtures/inventory-reservation)
task_run_root="$PWD/runs/workspaces/STUDY-0002/RUN-0001/inventory-reservation"
test ! -e "$task_run_root"
mkdir -p "$task_run_root"
git archive "$task_fixture_commit":benchmarks/fixtures/inventory-reservation | tar -x -C "$task_run_root"
git -C "$task_run_root" init
git -C "$task_run_root" add .
git -C "$task_run_root" -c user.name="Agent Lab" -c user.email="agent-lab@example.invalid" commit -m "baseline: TASK-002 broken state"
(cd "$task_run_root" && npm ci)
npm --prefix "$task_run_root" test
npm --prefix "$task_run_root" run typecheck
git -C "$task_run_root" rev-parse HEAD
```

마지막 SHA를 `run.md`의 `fixture.workspace_start_commit`에 기록한다.
`task_fixture_commit`은 `study.yaml`과 `run.md`의 `fixture.source_commit`에
기록한다.

## 3. 새 Codex 작업 생성

1. `runs/workspaces/STUDY-0002/RUN-0001/inventory-reservation` 폴더만 로컬
   프로젝트로 연다.
2. 모델을 `gpt-5.6-luna`, reasoning effort를 `high`로 설정한다.
3. 플러그인과 recommended plugins를 비활성화하고 Superpowers를 사용하지 않는다.
4. 화면에 실제 표시된 Model, reasoning effort, plugin과 Skill 목록을
   `study.yaml`과 `run.md`에 기록한다.
5. 새 작업의 task ID와 URL을 `run.md`의 `source_task`에 기록한다.
6. 해당 Run의 `prompt.md` 본문만 새 작업에 전달한다.
7. 구현 힌트, 파일 위치, 정답 패치, 평가 사례와 작업 순서를 추가로 알려주지 않는다.
8. 권한과 환경 문제 외에는 실행 중 개입하지 않는다.

독립 작업에는 fixture 저장소만 보이게 한다. Agent Lab의 설계 문서, 외부 평가기,
oracle과 다른 Run 결과를 컨텍스트에 넣지 않는다.

## 4. 완료 즉시 결과 고정

Agent가 완료를 선언하면 같은 작업에 추가 수정 요청을 보내지 않는다.

```bash
task_run_root="$PWD/runs/workspaces/STUDY-0002/RUN-0001/inventory-reservation"
task_results_root="$PWD/experiments/STUDY-0002/runs/RUN-0001"
task_start_commit=$(git -C "$task_run_root" rev-list --max-parents=0 HEAD)
git -C "$task_run_root" add -N .
git -C "$task_run_root" diff --binary "$task_start_commit" --output="$task_results_root/diff.patch"
git -C "$task_run_root" diff --stat "$task_start_commit"
```

`git add -N .`은 새 파일도 diff에 포함하기 위한 표시이며 파일 내용을 바꾸지 않는다.
Agent의 최종 응답은 `final-response.md`에 그대로 저장한다.

세션 JSONL 원본 위치와 task ID를 확인하고
[실행 정량 지표 정의](../metrics.md)에 따라 다음을 기록한다.

- `run.md`: 실행별 요약 지표와 행동 기록
- `trace-metrics.yaml`: 호출별 모델 응답 프록시, 인접 행동, token과 계산 검증

Trace가 직접 제공하지 않는 값은 추정하지 않는다. 특히 순수 모델 추론 시간은
provider telemetry가 없다면 `unavailable`로 두고, Trace 경계로 계산한
`model_response_phase_duration_ms_total`과 구분한다.

## 5. 첫 dry run 지표 대조

RUN-0001에서는 자동 또는 수동 추출값을 원본 JSONL과 대조한다.

1. `model_requests` 길이와 `model_request_count`가 같은지 확인한다.
2. 호출별 token 합이 마지막 누적 token 사용량과 같은지 확인한다.
3. `uncached_input_tokens`가 모두 0 이상인지 확인한다.
4. `cached_input_ratio`가 0~1인지 확인한다.
5. `peak_context_tokens`가 호출별 input 최댓값인지 확인한다.
6. 모든 상위 Tool 봉투에 같은 `call_id`의 output이 있는지 확인한다.
7. `tool_call_breakdown` 합이 논리 Tool Call 수와 같은지 확인한다.
8. 첫 편집 뒤 첫 공개 테스트의 결과가 `first_pass_success`와 일치하는지 확인한다.

Trace 구조가 계산 규칙과 다르면 임의로 보정하지 않고 해당 값을
`unavailable`로 기록한다. RUN-0001의 대조가 끝나기 전에는 RUN-0002~RUN-0005를
시작하지 않는다.

## 6. 독립 평가

```bash
task_run_root="$PWD/runs/workspaces/STUDY-0002/RUN-0001/inventory-reservation"
npm --prefix "$task_run_root" test
npm --prefix "$task_run_root" run typecheck
npm run evaluate:task-002 -- --candidate "$task_run_root"
```

결과를 `evaluation.yaml`에 기록하고 다음 항목을 수동 검토한다.

- 사용자 제보를 재현하는 회귀 테스트를 추가했는가?
- 추가한 테스트가 고장 난 기준 구현에서 실제로 실패하는가?
- 이미 취소된 예약의 재취소가 재고를 다시 늘리지 않는가?
- 첫 취소, 완료, 수량 부족과 존재하지 않는 예약 동작이 유지되는가?
- 다른 예약의 존재 여부에 기대는 재고 상한 보정 같은 우회 수정은 아닌가?
- 관련 없는 파일이나 지나치게 많은 코드를 수정하지 않았는가?
- Agent가 보고한 검증과 평가자가 독립 실행한 검증을 구분했는가?

추가된 회귀 테스트만 시작 상태에 적용해 실패하는지 확인한다. 이 검사는 테스트가
제보된 결함을 실제로 탐지하는지 확인하는 독립 평가이며, 구현 순서를 평가하는
기준이 아니다. 외부 평가가 실패해도 같은 Agent 작업을 다시 열지 않는다.

## 7. 오염 판단

다음 중 하나라도 발생하면 `contaminated: true`로 기록한다.

- Agent가 실행 공간 밖의 평가기, oracle, 설계 문서 또는 다른 Run 결과를 읽었다.
- 사람이 결함 위치나 수정 방법에 관한 힌트를 제공했다.
- 실행 중 모델, reasoning effort, 플러그인 또는 Skill 조건을 변경했다.
- 실제 시작 상태가 기록한 source 또는 workspace 시작 커밋과 다르다.

권한 승인이나 환경 복구는 사람 개입 표에 시점, 이유와 전달 내용을 기록하되
자동으로 오염으로 판정하지 않는다. 오염된 Trace는 참고 자료로 보존할 수 있지만
정식 비교 결과에는 포함하지 않는다.

## 8. 관찰 기록 작성

새 Codex 작업에 표시된 메시지, 명령, 파일 읽기·수정과 테스트 출력만 근거로
`run.md`의 사실 기반 행동 표를 순서대로 작성한다. 행동 유형은 `inspect`, `test`,
`edit`, `command`, `communicate` 중 하나를 사용한다. 숨겨진 사고 과정을 추정하거나
제공되지 않은 수치를 만들어내지 않는다.

사실 표를 먼저 완성한 뒤 해석 절에 유용했던 행동, 불필요하거나 위험했던 행동,
실패 후 복구, 관찰된 선택과 특징, 한계와 다음 질문을 기록한다. 탐색 순서,
편집 단위, 테스트 시점과 도구 선택은 평가 규범이 아니라 관찰 가능한 사실로
다룬다.

## 9. 반복 실행

RUN-0001의 지표 대조와 독립 평가가 완료된 뒤 같은 source commit에서
RUN-0002~RUN-0005를 각각 새 저장소와 새 Codex 작업으로 실행한다. 이전 Run의
프롬프트 외 결과, 해석 또는 수정 내용을 다음 Agent에게 제공하지 않는다.
