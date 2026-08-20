# TASK-001 외부 평가기

이 평가기는 `booking-scheduler` 후보 경로를 읽기 전용으로 불러와 예약 경계와 회귀 사례 9개를 확인한다.

## 실행

```bash
npm run evaluate:task-001 -- --candidate /absolute/path/to/booking-scheduler
```

## 예상 상태

- 추적되는 고장 난 픽스처: 인접 예약 사례 2개 실패, 종료 코드 `1`
- `oracle.patch`를 적용한 정상 픽스처: 전체 9개 통과, 종료 코드 `0`

평가기는 후보 파일을 수정하지 않는다. 관찰 대상 Agent의 실행 공간에는 이 디렉터리를 복사하지 않는다.
