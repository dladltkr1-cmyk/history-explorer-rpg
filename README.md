# 시간탐험대 — History Explorer RPG

초등학생용 2D 역사 탐험 RPG의 원본 프로젝트입니다. 기존 게임 소스와 이미지, 음악은 `dist/`에 있으며, `server/`는 이전 공개 사이트의 Worker입니다. GitHub Pages 배포물은 `scripts/build-pages.mjs`가 별도 폴더 `.pages-build/`에 만듭니다. 기존 공개 사이트의 배포 설정은 그대로 둡니다.

- 현재 실행 주소: https://history-explorer-rpg.dladltkr1.chatgpt.site/
- 새 GitHub Pages 주소: 저장소를 연결하고 첫 배포가 성공하면 확정합니다. 현재 학생용으로 공개되지 않았습니다.

## 실행과 빌드

```sh
npm ci
npm run build             # 기존 Worker 파일 검증
npm run dev               # 기존 API의 메모리 미리보기
HISTORY_SAVE_API=https://PROJECT.supabase.co/functions/v1/history-save npm run build:pages
```

Pages는 저장소의 `main` 브랜치가 갱신되면 `.github/workflows/pages.yml`로 배포합니다. GitHub Pages 설정에서 **GitHub Actions**를 배포 소스로 정하고, 저장소 변수 `HISTORY_SAVE_API`에 위 Edge Function URL을 넣어야 합니다. `.pages-build/`만 배포하며, `server/`와 이전 사이트 설정은 포함하지 않습니다. 이미지, 글꼴, CSS, JS, BGM은 저장소 하위 경로에서 상대 경로로 불러옵니다.

## 서버 저장 준비

1. 별도 Supabase 프로젝트에서 `supabase/migrations/20260927000000_game_saves.sql`을 적용합니다.
2. `supabase/functions/history-save`를 배포합니다. `supabase/config.toml`에서 이 함수의 JWT 검증이 꺼져 있으며, 함수에서 코드·요청 크기·출처를 검증합니다. 비밀키는 Supabase 함수의 서버 환경에만 둡니다.
3. 함수 환경 변수 `ALLOWED_ORIGINS`를 정확한 Pages origin(예: `https://username.github.io`)으로 설정합니다. 기존 HE 4자리 기록을 첫 조회에 가져오려면 `LEGACY_SAVE_URL=https://history-explorer-rpg.dladltkr1.chatgpt.site`도 지정합니다.
4. GitHub 저장소 변수 `HISTORY_SAVE_API=https://PROJECT.supabase.co/functions/v1/history-save`를 등록합니다. 여기에는 비밀키를 넣지 않습니다.

기존 학생 저장 구조와 `history-explorer-save-v1` localStorage 키는 유지합니다. Pages는 호스트가 달라 기존 공개 사이트의 브라우저 localStorage를 자동으로 읽을 수 없습니다. 기존 HE 4자리 코드는 첫 조회 시 이전 사이트의 서버 기록을 새 DB로 복사해 사용할 수 있습니다. 코드를 모르는 기기 저장은 기존 사이트에서 JSON으로 내보내 새 사이트에서 불러올 수 있습니다. HE 6자리 코드는 새 서버에서만 발급합니다. 개인 코드를 아는 사람은 진행을 열 수 있으므로 코드 공유에 주의하세요.

서버 DB는 `anon`과 `authenticated` 역할의 직접 접근을 차단합니다. 브라우저는 Edge Function만 호출하고, 서비스 비밀키는 함수 내부에만 있습니다. 오래된 저장의 갱신은 DB에서 원자적으로 거절합니다. 서버가 끊겨도 기기 저장과 플레이는 계속됩니다. 관리자 저장 시험은 학생 기록과 분리한 시험 코드로 수행합니다.

## 이전과 검증

이 프로젝트를 새 ChatGPT 계정에서 이어 갈 때 GitHub 저장소를 연결하고 `README.md`, `역사탐험RPG_업데이트_보고서.md`를 먼저 확인하세요. 기존 공개 사이트는 새 Pages 주소와 서버 저장을 두 기기에서 검증하기 전까지 유지합니다.

실서비스 점검: 새 게임 HE 6자리 발급, 다른 기기에서 코드 복원, 로컬 이어하기, 오프라인 재시도, HE 4자리 이전, 충돌 선택, 관리자 시험 코드, 이미지·음악·지도·말·퀘스트·태블릿 조작. 준비 전에는 Pages URL을 학생에게 배포하지 않습니다.
