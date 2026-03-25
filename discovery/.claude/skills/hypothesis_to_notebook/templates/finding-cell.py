"""
finding-cell.py
===============
Template for a single finding cell in a hypothesis notebook.

Each finding cell follows the _out pattern:
  1. Guard: check that the required dataframe is not empty
  2. Compute: derive all values needed for prose and chart from the dataframe
  3. Build detail table: string join of rows (avoids conditional f-strings)
  4. Build chart: Altair from actual data — NEVER hardcode values from report
  5. Build prose: string concatenation (not triple-quoted f-strings)
  6. _out = mo.vstack([mo.md("---"), mo.md(prose + table), chart], gap="1rem")
  7. Bare `_out` as the last expression (marimo captures this as cell output)

See references/marimo-patterns.md for all gotchas before editing.
"""

# ── Finding N — <Finding title> ───────────────────────────────────────────────
# Decorator arguments:
#   hide_code=True  for all finding cells (clean presentation mode)
# Function parameters = variables imported from upstream cells.
# Only declare the variables this cell actually needs.
@app.cell(hide_code=True)
def _(alt, df_source, fleet_avg_h, mo, pd, primary_entity):
    # ── 1. Guard ───────────────────────────────────────────────────────────────
    if primary_entity is None or df_source.empty:
        _out = mo.md("")
    else:
        # ── 2. Compute derived values ──────────────────────────────────────────
        # Derive everything needed for prose and chart from df_source.
        # Never paste hardcoded numbers from the outcome report here.
        _worst_group = df_source.nlargest(1, "avg_resolution_h").iloc[0]
        _best_group  = df_source.nsmallest(1, "avg_resolution_h").iloc[0]
        _multiplier  = (
            float(_worst_group["avg_resolution_h"])
            / float(_best_group["avg_resolution_h"])
            if float(_best_group["avg_resolution_h"]) > 0 else 0.0
        )

        # ── 3. Detail table — build as string rows, then join ─────────────────
        # Pattern: build each row as a formatted string, then "\n".join(rows).
        # Do NOT embed conditional expressions inside the table f-string.
        _table_rows = []
        for _, _row in df_source.iterrows():
            _sev = (
                "CRITICAL" if _row["avg_resolution_h"] > 300
                else "HIGH"  if _row["avg_resolution_h"] > 150
                else "OK"
            )
            _table_rows.append(
                f"| {_row['group_column']} "
                f"| {_row['avg_resolution_h']:.1f} "
                f"| {_row['reopen_pct']:.1f}% "
                f"| **{_sev}** |"
            )
        _table = "\n".join(_table_rows)

        # ── 4. Chart (Altair v6) ───────────────────────────────────────────────
        # Always built from df_source — never from hardcoded data.
        # Standard bar: width=620, height=260
        # Donut / small multiples: width=300, height=300
        _chart = (
            alt.Chart(df_source)
            .mark_bar(cornerRadiusTopLeft=3, cornerRadiusTopRight=3)
            .encode(
                x=alt.X(
                    "group_column:N",
                    sort="-y",
                    title=None,
                    axis=alt.Axis(labelAngle=-20, labelFontSize=11),
                ),
                y=alt.Y("avg_resolution_h:Q", title="Avg resolution (hours)"),
                color=alt.Color(
                    "severity:N",
                    scale=alt.Scale(
                        domain=["OK", "HIGH", "CRITICAL"],
                        range=["#3b82f6", "#f97316", "#dc2626"],
                    ),
                    legend=None,
                ),
                tooltip=[
                    alt.Tooltip("group_column:N",    title="Group"),
                    alt.Tooltip("avg_resolution_h:Q", title="Avg hours", format=".1f"),
                    alt.Tooltip("reopen_pct:Q",        title="Reopen %",  format=".1f"),
                    alt.Tooltip("tickets:Q",           title="Tickets"),
                ],
            )
            # Optional: reference lines for thresholds
            + alt.Chart(pd.DataFrame({"y": [150]}))
                .mark_rule(strokeDash=[4, 4], color="#f97316", size=1.5)
                .encode(y="y:Q")
        ).properties(
            title=alt.Title(
                "Chart Title",
                subtitle="Dashed line = HIGH threshold (150h) · Hover for detail",
            ),
            width=620,
            height=260,
        )

        # ── 5. Prose — string concatenation ───────────────────────────────────
        # DO NOT use triple-quoted f-strings with conditional expressions.
        # Build status labels as separate variables BEFORE the string.
        # Then concatenate plain strings and f-strings.
        _status = (
            "CRITICAL" if _multiplier > 4
            else "HIGH" if _multiplier > 2
            else "OK"
        )
        _prose = (
            "## N. Finding Title\n\n"
            "One sentence framing from the outcome report — "
            "numbers come from the data above, not pasted in.\n\n"
            "| Group | Avg Resolution (h) | Reopen % | Status |\n"
            "|-------|-------------------:|--------:|:------:|\n"
            + _table
            + "\n\n"
            f"**{_worst_group['group_column']}** runs at "
            f"**{_worst_group['avg_resolution_h']:.0f}h** average — "
            f"**{_multiplier:.1f}×** the best-performing group "
            f"({_best_group['group_column']}, {_best_group['avg_resolution_h']:.0f}h). "
            "Status: **" + _status + "**.\n\n"
            "> **Implication:** One sentence on what this means for the business."
        )

        # ── 6. Assemble output ─────────────────────────────────────────────────
        _out = mo.vstack(
            [mo.md("---"), mo.md(_prose), _chart],
            gap="1rem",
        )

    # ── 7. Bare _out as final expression ──────────────────────────────────────
    # This is the ONLY way marimo captures cell output in a conditional block.
    # Do NOT wrap in return, print, or mo.output.replace().
    _out
    return


# ── Mermaid flow cell template (optional) ─────────────────────────────────────
# Only add this if the outcome report includes a flow diagram.
# Use mo.mermaid(string) — NOT mo.md("```mermaid\n...\n```").
# Build the diagram string via concatenation to avoid brace-escaping issues.
@app.cell(hide_code=True)
def _(df_routing, mo, primary_entity):
    if primary_entity is None or df_routing.empty:
        _out = mo.md("")
    else:
        # Compute branch probabilities from data at runtime
        _total      = int(df_routing["tickets"].sum()) or 1
        _direct_pct = int(df_routing[df_routing["route"] == "DIRECT"]["tickets"].sum() / _total * 100)
        _l2_pct     = 100 - _direct_pct

        # Build Mermaid diagram via string concatenation (not f-string)
        # to avoid needing to escape { } in Mermaid syntax
        _diagram = "flowchart LR\n"
        _diagram += "    A[Ticket Created] --> B{L1 Triage}\n"
        _diagram += "    B -->|" + str(_direct_pct) + "% Direct| C[Resolved]\n"
        _diagram += "    B -->|" + str(_l2_pct) + "% L2 Bounce| D[L2 Review]\n"
        _diagram += "    D --> E[Resolved with delay]\n"

        _out = mo.vstack([
            mo.md("---\n## Lifecycle Flow"),
            mo.mermaid(_diagram),
        ], gap="1rem")
    _out
    return
