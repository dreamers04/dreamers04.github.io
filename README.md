# 아카이브 유월

작가, 그림 작가, 창작자를 위한 한국어 기반 세계관 아카이브 웹사이트입니다. 캐릭터 설정, 세계관 문서, 시나리오 초안, 아이디어 노트, 이미지 레퍼런스, 자유형 페이지 빌더 콘셉트를 한 화면에서 탐색할 수 있는 정적 웹 프로토타입입니다.

## 바로 보기

이 저장소는 별도 설치 없이 정적 사이트로 동작합니다.

- `index.html`을 브라우저로 열면 바로 확인할 수 있습니다.
- GitHub Pages에 올릴 때도 빌드 과정이 필요 없습니다.

## GitHub Pages 배포 방법

### 방법 A. 브랜치에서 바로 배포

1. GitHub에서 새 저장소를 만듭니다.
2. 이 폴더의 파일을 저장소에 업로드합니다.
   - `index.html`
   - `styles.css`
   - `app.js`
   - `assets/`
   - `.nojekyll`
   - `README.md`
3. 저장소의 `Settings`로 이동합니다.
4. 왼쪽 메뉴에서 `Pages`를 선택합니다.
5. `Build and deployment`에서 `Source`를 `Deploy from a branch`로 설정합니다.
6. `Branch`를 `main`, 폴더를 `/root`로 선택한 뒤 저장합니다.
7. 잠시 후 GitHub Pages 주소가 생성됩니다.

### 방법 B. GitHub Actions로 자동 배포

1. 이 폴더의 파일을 저장소에 업로드합니다.
2. 저장소의 `Settings`로 이동합니다.
3. 왼쪽 메뉴에서 `Pages`를 선택합니다.
4. `Build and deployment`의 `Source`를 `GitHub Actions`로 선택합니다.
5. `main` 브랜치에 파일을 올리면 `.github/workflows/deploy-pages.yml`이 자동으로 사이트를 배포합니다.

## 파일 구조

```text
.
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── forest-gate.png
│   ├── glass-tower.png
│   ├── letter-desk.png
│   ├── moon-city.png
│   ├── portrait-elia.png
│   └── sea-archive.png
├── .nojekyll
└── README.md
```

## 포함된 화면

- 홈 대시보드
- 캐릭터 설정과 캐릭터 추가
- 세계관 데이터베이스와 카테고리별 문서 추가
- Carrd 스타일 페이지 빌더
- HTML 임베드 미리보기
- 갤러리 / 무드보드 / 이미지 업로드
- 아이디어 노트 / 시나리오 초안 / 비공개 메모
- 카테고리 추가 및 삭제
- 설정 패널과 공개 범위 토글
- 모바일 사이드바

## 저장 방식

새로 만든 문서, 캐릭터, 세계관 항목, 페이지 빌더 섹션, 업로드한 이미지는 브라우저의 로컬 저장소에 저장됩니다. GitHub Pages처럼 서버가 없는 정적 사이트에서도 바로 작동하며, 같은 브라우저에서 새로고침해도 작성한 내용이 유지됩니다.

여러 기기 동기화, 로그인, 공동 편집, 대용량 이미지 저장이 필요하다면 이후 Supabase, Firebase, 또는 직접 만든 API 서버를 연결하면 됩니다.

## 기술 메모

현재 버전은 GitHub Pages에 쉽게 올릴 수 있도록 HTML, CSS, JavaScript만 사용하는 정적 사이트입니다. 이후 React, Next.js, Tailwind CSS, Framer Motion 기반으로 확장할 수 있도록 화면을 섹션 단위로 나누어 구성했습니다.
