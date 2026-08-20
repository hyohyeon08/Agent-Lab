# 연구 기록

이 디렉터리에는 재현 가능한 Study와 그 안의 Run 기록을 저장한다.

```text
experiments/STUDY-0001/
├── study.yaml
└── runs/
    └── RUN-0001/
        ├── run.md
        ├── prompt.md
        ├── final-response.md
        ├── evaluation.yaml
        └── diff.patch
```

- `study.yaml`: 연구 질문, 조건, 과제, 실행 목록
- `run.md`: 실행 전 예상, 사실 기반 행동 기록, 해석
- `prompt.md`: 관찰 대상 Agent에게 전달한 정확한 요청
- `final-response.md`: Agent의 최종 응답
- `evaluation.yaml`: 자동 평가와 수동 검토 결과
- `diff.patch`: 시작 커밋을 기준으로 한 최종 변경

`final-response.md`와 `diff.patch`는 Agent 실행이 끝난 뒤 실제 결과로 생성한다. 빈 결과 파일을 미리 만들지 않는다.
