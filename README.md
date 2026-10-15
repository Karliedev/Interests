# Oral Anatomy Explorer · Milestone 4 Demo

브라우저에서 `index.html`을 열어 실행해. 오른쪽 용어를 선택하면 왼쪽에 용어별 강조 개념도가 생성되고, 오른쪽 카드에서 원문 기반 특징·위치·기공 포인트·출처 구간을 확인할 수 있어.

**주의:** 현재 그림은 용어별로 바뀌는 교육용 개념도이며, 모든 용어의 정확한 해부학적 좌표를 검증한 전문 도판은 아니야. 강조 위치는 키워드 기반 근사 표시다. 임상 적용 전 표준 교재와 대조해야 해.


## Milestone 4.6 changes
- Removed the separate study-method panel; selected-term explanations now appear immediately below the diagram.
- Separated IPA generated from a pronunciation dictionary from the source-provided Korean approximation. IPA values that could not be generated are marked for verification rather than guessed.
- Kept browser speech playback in English (`en-NZ`).
- Rebuilt `data-bundle.js` from the current JSON data.


## Milestone 4.8 visual rebuild
All eight module diagrams were redrawn as flat, low-realism textbook-style vector illustrations with cream/beige anatomy and blue focus regions. The old generic per-term SVG generator was removed; term detail and location now remain in the adjacent text panel rather than producing misleading pseudo-anatomical mini-images. These diagrams are educational schematics and should be checked against a dental anatomy textbook before clinical use.


## 용어별 이미지

각 용어는 `data/term-images/<term-id>.svg` 개별 파일을 사용합니다. 이 파일들은 학습용 개념 도식이며, 구조별 해부학적 위치를 전문 교재와 대조하는 검증이 필요합니다.


## Term-specific illustration mapping

Each vocabulary entry has a unique SVG path recorded in `data/term-image-map.json`. The drawings use category-specific anatomical schematics and term-sensitive highlighting; they are educational concept diagrams, not diagnostic images or a substitute for an anatomical atlas. Missing term images do not silently fall back to unrelated category artwork.
