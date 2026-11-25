# KMGM 유튜버 초청 포스터

Next.js (App Router) + Tailwind CSS v4. KMGM 논현점 월간 유튜버 초청 일정 A2 인쇄용 포스터 편집기.

## 명령어

- `pnpm dev` — 개발 서버 (http://localhost:3000)
- `pnpm build` / `pnpm start` — 프로덕션 빌드 / 실행
- `pnpm format` — oxfmt

## 구조

- `src/app/layout.tsx` — 루트 레이아웃, 메타데이터(noindex), `globals.css` 로드
- `src/app/page.tsx` — 편집기를 `next/dynamic`(`ssr: false`)으로 불러온다. 편집기가 첫 렌더에서 localStorage를 읽기 때문에 서버 렌더링하지 않는다.
- `src/app/robots.ts` — 전체 크롤링 차단
- `src/components/PosterStudio.tsx` — 편집기 + 포스터 미리보기 + PNG/SVG 내보내기(html-to-image)
- `src/app/globals.css` — 전역 CSS, 포스터 스타일
- `public/` — 파비콘, 워터마크 마스크 이미지(`kmgm-holdem-mark.png`)

## 포스터 규칙

- 포스터는 항상 실제 출력 크기(760px, A2 420×594 비율)로 렌더링하고, 미리보기는 바깥 래퍼에 `transform: scale()`을 걸어 축소한다. 포스터 요소 자체에 transform을 걸면 내보내기 결과에 들어가므로 금지.
- 표 셀 글자 크기는 `--row-scale`(= min(1, 9 / 행 수))을 곱해 행 수에 맞춰 줄어든다.

## 스타일

- Tailwind v4는 `@tailwindcss/postcss`(`postcss.config.mjs`)로 연결한다.
- `globals.css`에서 레이어 밖에 있는 CSS는 Tailwind 유틸리티보다 우선한다. 전역 요소 스타일은 `@layer base { ... }` 안에 둔다.
