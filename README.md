# 히라가나다라마바사 V1

초등학생이 게임으로 히라가나를 반복 학습하는 개인용 iPhone PWA.

## 포함 기능
- 첫 실행 이름/캐릭터 생성
- iPhone 브라우저 LocalStorage에 진도 자동 저장
- Stage 1 기본 히라가나
- Stage 2 탁음/반탁음/조합음
- Stage 3 단어 + 정답 후 단어카드
- Stage 4 っ/ん 단어
- 히라가나비오나 게임
- 개구리점프 게임
- 자신감 체크(알아!/헷갈려) 기반 메타인지 기록
- 오답/자신감 불일치/복습 시점을 반영하는 재출제 가중치
- 학습 완료 리포트와 부모 화면
- 일본 여행 진행 목표
- PWA manifest + service worker + 오프라인 캐시
- 알림 권한/시간 설정 UI

## 로컬 실행
```bash
python3 -m http.server 4173
```
그 후 http://localhost:4173 접속.

## Cloudflare Pages 배포
가장 간단한 방법은 이 폴더를 GitHub 저장소에 올린 뒤 Cloudflare Dashboard > Workers & Pages > Create application > Pages > Import an existing Git repository 에서 연결하는 것.

정적 앱이므로:
- Build command: 비워두기 또는 `echo no-build`
- Build output directory: `/` (저장소 루트)

또는 Direct Upload로 폴더/zip을 업로드할 수 있다.

## iPhone 설치
Safari에서 배포 URL 접속 → 공유 버튼 → `홈 화면에 추가`.

## 정기 알림에 대한 중요 메모
현재 V1은 알림 권한과 희망 시간을 저장하지만, 앱이 닫힌 상태에서 매일 정해진 시간에 실제 알림을 보내려면 다음 단계에서 Cloudflare Worker + Web Push 구독 저장 + Cron Trigger를 연결해야 한다. 순수 PWA만으로 네이티브 iOS 로컬 알림처럼 임의 시각 예약은 하지 않는다.
