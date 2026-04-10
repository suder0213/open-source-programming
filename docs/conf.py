import os
import sys

# backend 모듈을 autodoc이 import할 수 있도록 경로 추가
sys.path.insert(0, os.path.abspath("../backend"))

# ── 프로젝트 정보 ──────────────────────────────────────────────────────────

project = "Game Hub"
author = "Game Hub Team"
release = "1.0.0"

# ── 확장 ──────────────────────────────────────────────────────────────────

extensions = [
    "sphinx.ext.autodoc",           # docstring → 문서 자동 생성
    "sphinx.ext.napoleon",          # Google / NumPy 스타일 docstring 지원
    "sphinx.ext.viewcode",          # 문서에 소스 코드 링크 추가
    "myst_parser",                  # .md 파일 지원
]

# ── 파일 설정 ──────────────────────────────────────────────────────────────

templates_path = ["_templates"]
static_path = ["_static"]
exclude_patterns = ["_build"]

# .md와 .rst 모두 소스 파일로 인식
source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

# ── HTML 출력 ──────────────────────────────────────────────────────────────

html_theme = "furo"
html_static_path = ["_static"]

# ── autodoc 설정 ──────────────────────────────────────────────────────────

autodoc_member_order = "bysource"   # 소스 코드 정의 순서대로 표시
autodoc_typehints = "description"   # 타입 힌트를 설명 본문에 포함

# Sphinx 빌드 환경에 설치되지 않은 패키지를 mock으로 대체
# (FastAPI, Pydantic은 실행 환경에만 필요, 문서 생성에는 불필요)
autodoc_mock_imports = ["fastapi", "pydantic"]
