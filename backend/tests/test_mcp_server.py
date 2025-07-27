from pathlib import Path
import asyncio
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import mcp_server


async def call_summary(paths):
    return await mcp_server._mcp_call_tool("summarize_csvs", {"paths": paths})


async def call_month_details(paths, month):
    return await mcp_server._mcp_call_tool(
        "month_details", {"paths": paths, "month": month}
    )


async def call_yoy(paths):
    return await mcp_server._mcp_call_tool("yoy_trends", {"paths": paths})


def test_mcp_tool(tmp_path):
    path1 = tmp_path / "a.csv"
    path1.write_text("Date,Category,Amount\n2024-01-01,income,100\n")
    result = asyncio.run(call_summary([str(path1)]))
    # call_tool returns a list of TextContent objects; parse JSON
    import json

    summary = json.loads(result[0].text)  # type: ignore[attr-defined]
    assert summary["overall_balance"] == 100.0


def test_mcp_month_and_yoy(tmp_path):
    path1 = tmp_path / "a.csv"
    path1.write_text(
        "Date,Category,Amount\n2024-01-01,income,100\n2024-01-02,rent,-50\n"
    )
    path2 = tmp_path / "b.csv"
    path2.write_text(
        "Date,Category,Amount\n2025-01-01,income,150\n2025-01-02,rent,-70\n"
    )

    import json

    details_res = asyncio.run(call_month_details([str(path1)], "2024-01"))
    details = json.loads(details_res[0].text)  # type: ignore[attr-defined]
    assert details["rent"] == -50

    yoy_res = asyncio.run(call_yoy([str(path1), str(path2)]))
    trends = json.loads(yoy_res[0].text)  # type: ignore[attr-defined]
    assert trends["01"] == 60
