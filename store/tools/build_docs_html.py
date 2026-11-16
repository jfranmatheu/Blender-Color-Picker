"""Build store/superhive/docs.html from DOCS.md.

Relative links and images are rewritten to absolute GitHub URLs, and the
output is plain body HTML (no <head>, styles or comments), because
Superhive's editor only keeps body elements. Run from the repository root:

    python store/tools/build_docs_html.py
"""
import re
from pathlib import Path
import markdown

ROOT = Path(__file__).resolve().parents[2]
REPO = "https://github.com/jfranmatheu/Blender-Color-Picker"
RAW = "https://raw.githubusercontent.com/jfranmatheu/Blender-Color-Picker/main/"

md = (ROOT / "DOCS.md").read_text(encoding="utf-8")
# The "Building from source" section is for developers, not store visitors.
md = re.sub(r"## Building from source.*?(?=\n## )", "", md, flags=re.S)
md = re.sub(r"\d+\. \[Building from source\]\(#building-from-source\)\n", "", md)
md = re.sub(r"(?m)^(\d+)\. \[", lambda m: "1. [", md)  # renumbering is automatic in <ol>

html = markdown.markdown(md, extensions=["tables", "toc", "fenced_code"])


def absolute(m):
    attr, url = m.group(1), m.group(2)
    if url.startswith(("http", "#", "mailto:")):
        return m.group(0)
    if attr == "src":
        return f'{attr}="{RAW}{url}"'
    kind = "tree" if not Path(url).suffix else "blob"
    return f'{attr}="{REPO}/{kind}/main/{url}"'


html = re.sub(r'(src|href)="([^"]+)"', absolute, html)

# Superhive strips <head>, <style> and comments, so write plain body elements only.
page = html + "\n"
(ROOT / "store" / "superhive" / "docs.html").write_text(page, encoding="utf-8")
print("written store/superhive/docs.html")
