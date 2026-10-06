# 고대 국가 인물·거처 자산 기록 · v44.2

## 기존 인물 재사용

일반 도우미는 기존 `farmer`, `shopkeeper`, `elder` 자산을 재사용한다. 필드 표시 키는 61px, 원본의 투명 여백만 제외하고 종횡비를 유지한다. 상인과 도우미 얼굴이 같은 마을에서 중복되지 않도록 기존 인물 중에서 배정한다. 일반 NPC를 새 그림으로 대체하지 않는다.

## 건국 인물 전용 자산

이미지 생성 도구로 인물별 투명 PNG를 만들고 원본을 그대로 복사했다. 기준 그림은 게임의 기존 농부와 기본 소년 캐릭터였다. 필드에서 투명 여백을 제외한 종횡비를 유지하며 66px 키로 표시한다. 아래는 생성 지침의 요약이다.

공통 지침: 기존 한국 역사 학습 게임의 픽셀/SD 화풍, 한 명의 전신, 좁고 자연스러운 사람 체형, 작은 머리, 읽기 쉬운 얼굴·의복, 정면에서 약간 틀어진 시점, 발까지 모두 포함, 투명 배경. 기본 저고리/겉옷·바지·허리띠·신발을 사용하며 현대 물건·황금 왕관·과장된 장식은 배제한다.

| 인물 | 자산 경로 | 개별 생성 지침 | 생성 결과 |
| --- | --- | --- | --- |
| 주몽 | `dist/assets/ancient/jumong-v44.png` | 남색 겉옷, 활, 상투, 수염과 자신감 있는 눈썹 | `generated_images/exec-0bc99a3f-d050-4c1a-b8b4-da8f4279cded.png` |
| 온조 | `dist/assets/ancient/onjo-v44.png` | 황토·크림색 옷, 소박한 머리띠, 콧수염, 말아 든 천 | `generated_images/exec-e130e01b-ef90-42e1-aa60-4d2c3e9a6ee5.png` |
| 박혁거세 | `dist/assets/ancient/hyeokgeose-v44.png` | 옅은 크림색과 올리브색 테두리, 젊고 수염 없는 얼굴, 상투 | `generated_images/exec-6f28d4c8-fcd6-4f32-b4d2-6b475a579f20.png` |
| 김수로 | `dist/assets/ancient/suro-v44.png` | 이끼색 옷, 소박한 머리띠, 건장한 체형, 짧은 수염, 작은 철제 도구 | `generated_images/exec-524c2cb6-6334-450f-9ea5-fa52d08d8660.png` |

얼굴·색은 게임 재구성이다. [국립중앙박물관 전통복식 전시](https://www.museum.go.kr/MUSEUM/contents/M0202030000.do?exhiSpThemId=3949&listType=list&menuId=past&schM=view)의 삼국시대 기본 의복 형태를 참고했으며, 특정 창건 인물의 실제 얼굴·정확한 왕복·나라의 공식 색을 재현했다고 주장하지 않는다.

## 작은 거처와 마당

기존 코드 기반 SVG 생성기를 수정했다. 건물 크기·방·보관 기능은 공통이며 고구려는 회갈색 지붕·차분한 벽·소나무/바위, 백제는 밝은 지붕·벽·열린 마당, 신라는 따뜻한 지붕·벽·풀 주변을 사용한다. 작은 천 색도 각각 남색·청록·녹색으로 구분한다. 이 색은 게임의 장소 구분을 위한 표현이다.

`dist/assets/ancient/horse-post.svg`는 나무 기둥·밧줄·먹이통의 소박한 말 쉼터이며 말 그림은 기존 `horseLeftIdle` 자산이다.

## 백지도 원본 확인

| 세기 | 원본 파일 | 저장 자산 | SHA-256 |
| --- | --- | --- | --- |
| 4 | 역사 백지도_삼국 시대(백제 전성기).jpg | `dist/assets/ancient/map-baekje-original.jpg` | `f2ef95a9e9f5e10cb91ddd44a829796a22ffc041feb2105c096f607eb385f5b2` |
| 5 | 역사 백지도_삼국 시대(고구려 전성기).jpg | `dist/assets/ancient/map-goguryeo-original.jpg` | `f7da545927b312dd190627dcc69c12e72d5fc1e497f61be896a0ac1b6ba9810f` |
| 6 | 역사 백지도_삼국 시대(신라 전성기).jpg | `dist/assets/ancient/map-silla-original.jpg` | `93582fdef1d9dc06618d9833ea85020020b4ca55484bf6ae83148cd28a4e41c3` |

세 원본은 1447×2048이며 자산과 원본의 해시가 같다. 최신 요청에 따라 표시만 `[103,241,1242,1704]`로 잘라 바깥 제목·흰 여백을 제외한다. 지도 생성·재도식화·재인코딩은 하지 않았다. 이동 표식은 별도 DOM 오버레이며 잘라낸 화면의 좌표로 환산한다.
