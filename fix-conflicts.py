import json
from pathlib import Path

ROOT = Path("content")

def resolve_conflicts(text):
    lines = text.splitlines(keepends=True)
    result = []
    stack = []

    for line in lines:
        stripped = line.strip()

        if stripped == "<<<<<<< HEAD":
            stack.append(True)
            continue

        if stripped == "=======":
            if stack:
                stack[-1] = False
            continue

        if stripped.startswith(">>>>>>>"):
            if stack:
                stack.pop()
            continue

        if all(stack):
            result.append(line)
        elif not stack:
            result.append(line)

    return "".join(result)


files = list(ROOT.rglob("*.json"))

fixed = []
failed = []

for path in files:
    original = path.read_text(encoding="utf-8")

    if "<<<<<<<" not in original:
        continue

    cleaned = resolve_conflicts(original)

    try:
        json.loads(cleaned)
    except json.JSONDecodeError as e:
        failed.append((path, str(e)))
        continue

    path.write_text(cleaned, encoding="utf-8")
    fixed.append(path)

print(f"Files checked: {len(files)}")
print(f"Files fixed:   {len(fixed)}")
print(f"Files failed:  {len(failed)}")

for path in fixed:
    print(f"FIXED: {path}")

if failed:
    print("\nFAILED FILES:")
    for path, error in failed:
        print(f"{path}: {error}")
PYcat > fix-conflicts.py <<'PY'
import json
from pathlib import Path

ROOT = Path("content")

def resolve_conflicts(text):
    lines = text.splitlines(keepends=True)
    result = []
    stack = []

    for line in lines:
        stripped = line.strip()

        if stripped == "<<<<<<< HEAD":
            stack.append(True)
            continue

        if stripped == "=======":
            if stack:
                stack[-1] = False
            continue

        if stripped.startswith(">>>>>>>"):
            if stack:
                stack.pop()
            continue

        if all(stack):
            result.append(line)
        elif not stack:
            result.append(line)

    return "".join(result)


files = list(ROOT.rglob("*.json"))

fixed = []
failed = []

for path in files:
    original = path.read_text(encoding="utf-8")

    if "<<<<<<<" not in original:
        continue

    cleaned = resolve_conflicts(original)

    try:
        json.loads(cleaned)
    except json.JSONDecodeError as e:
        failed.append((path, str(e)))
        continue

    path.write_text(cleaned, encoding="utf-8")
    fixed.append(path)

print(f"Files checked: {len(files)}")
print(f"Files fixed:   {len(fixed)}")
print(f"Files failed:  {len(failed)}")

for path in fixed:
    print(f"FIXED: {path}")

if failed:
    print("\nFAILED FILES:")
    for path, error in failed:
        print(f"{path}: {error}")
