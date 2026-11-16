"""Build the installable Color Picker zip for the stores (Superhive, Payhip).

Uses Blender's own extension builder, so the zip is exactly what Blender
expects to install. Output goes to store/build/, which git ignores.

Run from anywhere:

    python store/tools/build.py
    python store/tools/build.py --blender "C:/path/to/blender.exe"

The Blender executable is taken from --blender, then the BLENDER environment
variable, then `blender` on PATH, then the default Windows install folders.
"""
import argparse
import glob
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "color_picker"
OUT = ROOT / "store" / "build"


def find_blender(cli_path):
    for candidate in (cli_path, os.environ.get("BLENDER"), shutil.which("blender")):
        if candidate and Path(candidate).is_file():
            return candidate
    # Newest "Blender X.Y" folder under the default Windows install location.
    found = glob.glob(r"C:\Program Files\Blender Foundation\Blender *\blender.exe")
    if found:
        return sorted(found, key=lambda p: [int(n) for n in re.findall(r"\d+", Path(p).parent.name)])[-1]
    sys.exit("Blender not found. Pass --blender PATH or set the BLENDER environment variable.")


def read_manifest():
    text = (SRC / "blender_manifest.toml").read_text(encoding="utf-8")
    version = re.search(r'^version\s*=\s*"([^"]+)"', text, re.M).group(1)
    min_blender = re.search(r'^blender_version_min\s*=\s*"([^"]+)"', text, re.M).group(1)
    return version, min_blender


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--blender", help="path to the Blender executable")
    args = parser.parse_args()

    blender = find_blender(args.blender)
    version, min_blender = read_manifest()
    major_minor = ".".join(min_blender.split(".")[:2])
    name = f"ColorPicker_v{version}_Blender_{major_minor}+.zip"

    # Don't ship Python caches.
    for cache in SRC.rglob("__pycache__"):
        shutil.rmtree(cache, ignore_errors=True)

    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([blender, "--factory-startup", "--command", "extension", "validate", str(SRC)], check=True)
        subprocess.run([blender, "--factory-startup", "--command", "extension", "build",
                        "--source-dir", str(SRC), "--output-dir", tmp], check=True)
        built = list(Path(tmp).glob("*.zip"))
        if len(built) != 1:
            sys.exit(f"Expected one zip from Blender, got: {built}")
        target = OUT / name
        shutil.move(str(built[0]), target)

    print(f"\nBuilt {target.relative_to(ROOT)} ({target.stat().st_size // 1024} KB) with {blender}")


if __name__ == "__main__":
    main()
