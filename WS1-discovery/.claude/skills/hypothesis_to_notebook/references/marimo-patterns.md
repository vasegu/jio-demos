# Marimo Patterns Reference

Patterns, gotchas, and lessons distilled from building marimo notebooks.
Read this before writing or editing any marimo notebook.

---

## Execution model

Marimo cells are functions, not scripts. Each cell is:

```python
@app.cell
def _(imported_var_1, imported_var_2):
    result = ...
    return (result,)
```

- **Function parameters** are the variables this cell imports from other cells.
- **Return tuple** is what this cell exports to downstream cells.
- Marimo re-runs cells automatically when any imported variable changes.
- There is no shared global state between cells (unlike Jupyter).

### What counts as cell output

Marimo captures **the last bare top-level expression** in a cell as its display output.

```python
# ✓ Correct — bare expression at top level
_out = mo.md("hello")
_out

# ✗ Wrong — return statement, not a bare expression
return mo.md("hello")

# ✗ Wrong — mo.output.replace() bypasses the reactive model
mo.output.replace(mo.md("hello"))
```

---

## The `_out` pattern (conditional rendering)

**Problem:** marimo can only capture one expression as output. If you write `if/else`
and call `mo.md()` in each branch, neither is captured.

**Solution:** assign to `_out` inside the branch, then write `_out` as a bare
top-level expression after the block.

```python
@app.cell(hide_code=True)
def _(df, primary_entity):
    if primary_entity is None or df.empty:
        _out = mo.md("")
    else:
        _out = mo.vstack([mo.md("## Finding"), chart])
    _out          # ← this is the cell output; do NOT omit
    return
```

`return` at the end is intentional and correct — it makes the cell export nothing
(all its variables are private `_` names).

---

## Naming conventions

| Prefix | Meaning | Example |
|--------|---------|---------|
| `_`    | Private to this cell — not exported | `_chart`, `_tbl`, `_out` |
| No prefix | Exported to downstream cells | `QUERIES`, `run`, `df_types` |

Marimo identifies exported variables by the return tuple. Variables not in the
return tuple cannot be used by other cells, even if they have no prefix.

---

## pg8000 driver (ARM Mac SSL fix)

`psycopg2-binary` has SSL issues on ARM Macs. Use `pg8000` instead:

```python
_engine = create_engine(
    _db_url.replace("postgresql://", "postgresql+pg8000://"),
    connect_args={"ssl_context": True},
    pool_pre_ping=True,
)
```

The `replace()` is safe even if the URL already starts with `postgresql+pg8000://`
because it won't match twice. The `ssl_context=True` shorthand tells pg8000 to
use the system's default SSL context with certificate verification.

---

## `mo.callout` side-effect gotcha

`mo.callout(...)` is a UI element, not a side effect. If you call it inside a
conditional and don't assign it to a variable that becomes cell output, it is
silently discarded.

```python
# ✗ This callout is never shown — it's not assigned or returned
if _engine is None:
    mo.callout(mo.md("Not connected"), kind="warn")

# ✓ Correct: assign and use the _out pattern, or just let the
#   connection status be shown as a cell output side-effect by
#   NOT returning anything else from that cell
mo.callout(mo.md("Connected"), kind="success")   # shown as cell output
return (run,)                                      # only run is exported
```

The engine + run() cell relies on this: the callout is shown because it is the
last expression before `return (run,)` — marimo will attempt to render it, but
since `return (run,)` exports only `run`, the callout is a display side-effect
of Cell 2's output slot. In practice this works in marimo 0.20 but is fragile —
prefer the `_out` pattern for cells that need both display AND exports.

---

## `mo.mermaid()` vs embedded Mermaid

| Approach | Works? | Notes |
|----------|--------|-------|
| `mo.mermaid(diagram_str)` | ✓ | Built-in, no extra packages |
| `mo.md("```mermaid\n...\n```")` | ✗ | HTML sanitiser strips it |

Always use `mo.mermaid()`. Build the diagram string via concatenation, not
f-strings, to avoid escaping `{` and `}` in Mermaid syntax:

```python
# ✓ String concatenation — no escaping needed
_diagram = "flowchart LR\n"
_diagram += "    A --> B{Condition}\n"
_diagram += "    B -->|" + str(pct) + "%| C\n"

# ✗ f-string — the { } in Mermaid syntax must be doubled {{ }}
_diagram = f"flowchart LR\n    A --> B{{Condition}}\n    B -->|{pct}%| C\n"
```

---

## Altair NaN hygiene

SQL aggregates with optional groups, outer joins, or sparse cross-tabs return NULL for empty combinations. `pd.read_sql()` converts these to `NaN`, which Altair cannot serialize to JSON — it raises `ValueError: Out of range float values are not JSON compliant: nan`.

**Pattern:** create a `_chart_df` copy with `.dropna(subset=[...])` before every `alt.Chart()` call. Keep the original `_df` for prose and table generation where NaN is harmless.

```python
# _df used for prose/tables — NaN rows are fine here
_chart_df = _df.dropna(subset=["x_field", "y_field", "color_field"])
_chart = alt.Chart(_chart_df).mark_bar().encode(
    x="x_field:N",
    y="y_field:Q",
    color="color_field:N",
)
```

**`subset` must match your `.encode()` fields exactly** — list every column passed to `x=`, `y=`, `color=`, `theta=`, and `tooltip=`. A row is dropped if any of the subset columns is NULL (correct — a partial row cannot be rendered as a chart point).

Do NOT call `.dropna()` without `subset`. It drops any row with a NULL in *any* column, silently removing valid data points whose only NaN is in an unrelated column.

---

## Altair v6 patterns

### Basic bar chart

```python
alt.Chart(df).mark_bar(cornerRadiusTopLeft=3, cornerRadiusTopRight=3).encode(
    x=alt.X("col:N", sort="-y", title=None,
            axis=alt.Axis(labelAngle=-20, labelFontSize=11)),
    y=alt.Y("value:Q", title="Label"),
    color=alt.Color("severity:N",
        scale=alt.Scale(
            domain=["OK", "HIGH", "CRITICAL"],
            range=["#3b82f6", "#f97316", "#dc2626"],
        ),
        legend=None,
    ),
    tooltip=[...],
).properties(
    title=alt.Title("Title", subtitle="Subtitle · hover for detail"),
    width=620, height=260,
)
```

### Reference lines (threshold rules)

```python
+ alt.Chart(pd.DataFrame({"y": [150]}))
    .mark_rule(strokeDash=[4, 4], color="#f97316", size=1.5)
    .encode(y="y:Q")
```

Layer multiple charts with `+`. Reference line data must be a DataFrame,
not a literal (Altair v6 no longer accepts bare dicts).

### Donut / pie

```python
alt.Chart(df).mark_arc(innerRadius=60).encode(
    theta=alt.Theta("value:Q"),
    color=alt.Color("label:N"),
    tooltip=[...],
).properties(width=300, height=300)
```

### Standard sizes

| Chart type | width | height |
|-----------|------:|------:|
| Bar / line | 620 | 260 |
| Donut | 300 | 300 |
| Small multiples (facet) | 200 | 200 per facet |

---

## Prose f-string gotchas

### Do NOT use conditional expressions inside triple-quoted f-strings

```python
# ✗ Fragile — conditional inside the f-string breaks on complex values
_prose = f"""
Status: {"CRITICAL" if val > 300 else "HIGH" if val > 150 else "OK"}
"""

# ✓ Build status label as a separate variable first
_status = "CRITICAL" if val > 300 else "HIGH" if val > 150 else "OK"
_prose = f"Status: **{_status}**\n"
```

### Triple-quoted f-strings and markdown tables

Indentation inside triple-quoted strings becomes part of the string.
If the string is inside an `if` block that is indented, the markdown table
will have leading spaces, which some parsers interpret as a code block.

**Safest pattern:** build the table rows separately, join them, then
concatenate with the prose string:

```python
_rows = [f"| {r['col']} | {r['val']:.1f} |" for _, r in df.iterrows()]
_table = "\n".join(_rows)

_prose = (
    "## Heading\n\n"
    "Framing sentence.\n\n"
    "| Column | Value |\n"
    "|--------|------:|\n"
    + _table
    + "\n\n"
    f"Summary with **{val:.1f}** from data."
)
```

---

## SQL query parser

The regex used in Cell 1 to parse `queries.sql`:

```python
for _m in re.finditer(
    r"-- @name: (\w+)\n(.*?)(?=\n-- -{10,}|\Z)", _raw, re.DOTALL
):
    _name = _m.group(1)
    _body = _m.group(2).strip()
    _body = re.sub(r"\n-- -{10,}.*", "", _body, flags=re.DOTALL).strip()
    QUERIES[_name] = _body
```

- Separator pattern `-- ----------` must be at least 10 dashes.
- The trailing `re.sub` strips any separator line that was captured by `.*?`
  before the lookahead matched.
- `re.DOTALL` makes `.` match newlines so multi-line query bodies are captured.

### `run()` substitution conventions

| Placeholder | Substituted with | Notes |
|-------------|-----------------|-------|
| `$1` | `:start_date` | Bound to `START_DATE` via SQLAlchemy params |
| `$2` | `:end_date` | Bound to `END_DATE` |
| `$3` | `"8"` (literal string) | Action-sequence limit; change per skill |

If a query uses more positional params, extend the `run()` substitution chain.

---

## Cell return tuple ordering

Marimo requires the return tuple to be **alphabetically ordered** for reliable
dependency tracking. When a cell exports many variables:

```python
return (
    df_actions,
    df_bounce,
    df_l2,
    df_lifecycle,
    df_reopen,
    df_routing,
    df_types,
    df_waits,
)
```

Not enforced by the runtime, but breaking alphabetical order can cause
confusing "variable not found" errors in complex notebooks.

---

## hide_code decorator

```python
@app.cell(hide_code=True)   # code hidden in presentation/run mode
@app.cell                   # code visible (default)
```

Use `hide_code=True` on:
- Cell 1 (imports, SQL parser — boilerplate)
- Cell 5+ (all display/finding cells — users care about output, not code)

Do NOT hide Cell 2 (engine + run) because the connection callout is
meaningful output — users need to see it to diagnose connection issues.

---

## Nested `mo.accordion` for SQL source panel

The recommendations cell includes a nested accordion showing each named query
as a SQL code block:

```python
mo.accordion({
    "Schema & SQL source": mo.vstack([
        mo.md(schema_reference_text),
        mo.accordion({
            f"SQL: {name}": mo.md(f"```sql\n{sql}\n```")
            for name, sql in QUERIES.items()
        }),
    ])
})
```

`QUERIES` must be imported from Cell 1 via the function parameter. The inner
`mo.accordion({...})` uses a dict comprehension — this is valid in Python 3.12+.

---

## `mo.stat` tile pattern

```python
mo.stat(
    value_string,            # e.g. "42.3h"
    label="Short label",     # shown below value
    caption="Context text",  # smaller text, optional
    direction="increase",    # "increase" | "decrease" | "neutral"
    bordered=True,
)
```

Use `direction="increase"` for metrics where higher = worse (e.g. resolution
time, reopen rate). This shows a red upward arrow, which aligns with the
CRITICAL/HIGH/OK status convention.

---

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `NameError: name 'X' is not defined` | Variable not in function params | Add it to `def _(... X ...):` |
| Cell output not showing | `_out` not a bare top-level expression | Check for return/print wrapping it |
| Mermaid not rendering | Used `mo.md("```mermaid...")` | Switch to `mo.mermaid(string)` |
| SSL error on connect | psycopg2-binary on ARM Mac | Use pg8000 driver (see above) |
| `Write` tool rejected: "file modified since read" | Linter ran between read and write | Re-read first 5 lines then retry write |
| `ValueError: Out of range float values are not JSON compliant: nan` | SQL NULL → pandas NaN passed to `alt.Chart()` | `.dropna(subset=[encoded cols])` on `_chart_df` before charting (see Altair NaN hygiene) |
| Brace literal in f-string | `{` in Mermaid/SQL inside f-string | Use string concatenation instead |
