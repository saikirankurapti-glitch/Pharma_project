import json
import os
import csv
from pathlib import Path

out = Path("functional-report")
out.mkdir(exist_ok=True)

rows = []

playwright_file = Path("playwright-report/../playwright-results.json")
if not playwright_file.exists():
    playwright_file = Path("playwright-results.json")

if playwright_file.exists():
    data = json.loads(playwright_file.read_text(encoding="utf-8"))
    def walk(suite):
        for spec in suite.get("specs", []):
            for result in spec.get("tests", []):
                status = result.get("status", "unknown")
                rows.append({
                    "Test Case ID": spec.get("title", ""),
                    "Source": "Playwright UI",
                    "Status": "PASS" if status == "expected" else "FAIL" if status in ("unexpected", "failed") else "SKIPPED",
                    "Duration ms": result.get("duration", ""),
                    "Error": "; ".join(e.get("message", "") for e in result.get("errors", [])),
                })
        for child in suite.get("suites", []):
            walk(child)
    walk(data)

api_file = Path("all-181-results.json")
if api_file.exists():
    data = json.loads(api_file.read_text(encoding="utf-8"))
    for r in data.get("results", []):
        rows.append({
            "Test Case ID": r.get("id", ""),
            "Source": "API/Contract",
            "Status": r.get("status", ""),
            "Duration ms": r.get("ms", ""),
            "Error": r.get("error", ""),
        })

with open(out / "functional-test-results.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["Test Case ID","Source","Status","Duration ms","Error"])
    writer.writeheader()
    writer.writerows(rows)

summary = {}
for r in rows:
    summary[r["Status"]] = summary.get(r["Status"], 0) + 1

(out / "functional-summary.json").write_text(json.dumps({
    "total": len(rows),
    "summary": summary,
    "note": "Results combine browser functional checks and the existing 181 API/contract suite. UI and API results are kept distinguishable."
}, indent=2), encoding="utf-8")

print(json.dumps({"total": len(rows), "summary": summary}, indent=2))
