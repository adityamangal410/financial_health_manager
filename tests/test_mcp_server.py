from pathlib import Path
import asyncio
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import mcp_server


async def call_summary(paths):
    return await mcp_server._call_tool("summarize_csvs", {"paths": paths})


def test_mcp_tool(tmp_path):
    path1 = tmp_path / "a.csv"
    path1.write_text("Date,Category,Amount\n2024-01-01,income,100\n")
    result = asyncio.run(call_summary([str(path1)]))
    # call_tool returns a list of TextContent objects; parse JSON
    import json

    summary = json.loads(result[0].text)
    assert summary["overall_balance"] == 100.0
