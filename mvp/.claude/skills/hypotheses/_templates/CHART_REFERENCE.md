# Chart Reference — Vega-Lite v5 Patterns

This file provides valid, working Vega-Lite v5 examples for every chart type that skills may use in outcome reports. When a report template references a chart type, use the corresponding example here as the structural starting point and populate `"values"` from actual query results.

All specs **MUST** include `"$schema": "https://vega.github.io/schema/vega-lite/v5.json"`.

---

## Bar (Vertical)

**When to use:** Compare a single metric across categories (dealers, action codes, regions).
**KPI pattern:** Direct comparison — e.g., dwell time by action code, ticket count by dealer.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 500,
  "height": 300,
  "data": {
    "values": []
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "<category_field>", "type": "nominal", "sort": "-y", "axis": {"labelAngle": -45}},
    "y": {"field": "<value_field>", "type": "quantitative", "title": "<Value Label (units)>"},
    "color": {"field": "<group_field>", "type": "nominal"},
    "tooltip": [
      {"field": "<category_field>", "type": "nominal"},
      {"field": "<value_field>", "type": "quantitative", "format": ".1f"}
    ]
  }
}
```

**Key customisation:**
- Use `"sort": "-y"` to rank bars by value descending.
- Set `"labelAngle": -45` when category labels are long.
- Add `"color"` encoding to distinguish groups (e.g., dealer types).

---

## Bar + Threshold Overlay

**When to use:** Compare values against a target/SLA line.
**KPI pattern:** Any KPI with a numeric threshold — e.g., dwell time vs SLA, reopen rate vs benchmark.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 500,
  "height": 300,
  "data": {
    "values": []
  },
  "layer": [
    {
      "mark": "bar",
      "encoding": {
        "x": {"field": "<category_field>", "type": "nominal", "axis": {"labelAngle": -20}},
        "y": {"field": "<value_field>", "type": "quantitative", "title": "<Value Label (units)>"},
        "color": {"value": "#4C78A8"}
      }
    },
    {
      "mark": {"type": "rule", "strokeDash": [4, 4], "color": "#D14343"},
      "encoding": {
        "y": {"datum": 0}
      }
    }
  ]
}
```

**Key customisation:**
- Replace `"datum": 0` with the actual threshold value.
- For per-bar thresholds, use `"field": "threshold"` instead of `"datum"` and include threshold values in the data.
- Threshold colour: red (`#D14343`) for SLA breaches, grey (`#666`) for reference lines.

---

## Grouped Bar

**When to use:** Compare multiple metrics across categories side-by-side.
**KPI pattern:** Multi-metric comparison — e.g., wait times (L2, Parts, Info) by dealer type.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 500,
  "height": 300,
  "data": {
    "values": []
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "<group_field>", "type": "nominal", "title": "<Group Label>"},
    "y": {"field": "<value_field>", "type": "quantitative", "title": "<Value Label (units)>"},
    "color": {"field": "<metric_field>", "type": "nominal", "title": "<Metric Label>"},
    "xOffset": {"field": "<metric_field>"}
  }
}
```

**Key customisation:**
- `"xOffset"` creates side-by-side grouping; each metric gets its own sub-bar.
- Control group order with `"sort"` on the x-axis.
- Use a custom `"scale": {"domain": [...], "range": [...]}` on color for consistent palette.

---

## Stacked Bar

**When to use:** Show composition / part-of-whole breakdown across categories.
**KPI pattern:** Distribution — e.g., reopen reasons by dealer, closure types by month.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 500,
  "height": 300,
  "data": {
    "values": []
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "<category_field>", "type": "nominal"},
    "y": {"field": "<value_field>", "type": "quantitative", "stack": "normalize", "title": "Proportion"},
    "color": {"field": "<segment_field>", "type": "nominal", "title": "<Segment Label>"},
    "tooltip": [
      {"field": "<category_field>", "type": "nominal"},
      {"field": "<segment_field>", "type": "nominal"},
      {"field": "<value_field>", "type": "quantitative"}
    ]
  }
}
```

**Key customisation:**
- Use `"stack": "normalize"` for 100% stacked bars (proportions), or omit for absolute stacked bars.
- Good for showing how composition changes across groups (e.g., reopen reasons by dealer type).

---

## Donut / Arc

**When to use:** Show proportion of a total for a single category set.
**KPI pattern:** Share of total — e.g., % of resolution time in each wait state.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 300,
  "height": 300,
  "data": {
    "values": []
  },
  "mark": {"type": "arc", "innerRadius": 60},
  "encoding": {
    "theta": {"field": "<value_field>", "type": "quantitative"},
    "color": {"field": "<category_field>", "type": "nominal", "scale": {"scheme": "tableau10"}},
    "tooltip": [
      {"field": "<category_field>", "type": "nominal"},
      {"field": "<value_field>", "type": "quantitative", "format": ".1f"}
    ]
  }
}
```

**Key customisation:**
- `"innerRadius": 60` creates donut; set to `0` for pie.
- Best with 3-6 segments; more than 8 becomes hard to read.
- Pair with a table for exact values.

---

## Line with Points

**When to use:** Show trends over time.
**KPI pattern:** Any KPI tracked monthly/weekly — e.g., reopen rate trend, backlog growth.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 500,
  "height": 250,
  "data": {
    "values": []
  },
  "layer": [
    {
      "mark": {"type": "line", "point": true},
      "encoding": {
        "x": {"field": "<time_field>", "type": "ordinal", "title": "<Time Label>"},
        "y": {"field": "<value_field>", "type": "quantitative", "title": "<Value Label (units)>"},
        "color": {"field": "<series_field>", "type": "nominal"}
      }
    },
    {
      "mark": {"type": "rule", "strokeDash": [4, 4], "color": "#D14343"},
      "encoding": {
        "y": {"datum": 0}
      }
    }
  ]
}
```

**Key customisation:**
- Replace `"datum": 0` with the threshold/target value for the reference line.
- Use `"type": "temporal"` for proper date parsing; use `"ordinal"` for pre-formatted period strings (e.g., "2024-06").
- Multiple series via `"color"` encoding (e.g., one line per dealer type).

---

## Scatter / Quadrant

**When to use:** Plot two variables against each other to reveal clusters and outliers.
**KPI pattern:** Speed vs quality — e.g., resolution time vs reopen rate, with quadrant reference lines.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 450,
  "height": 450,
  "data": {
    "values": []
  },
  "layer": [
    {
      "mark": {"type": "point", "filled": true, "size": 150},
      "encoding": {
        "x": {"field": "<x_field>", "type": "quantitative", "title": "<X Label (units)>"},
        "y": {"field": "<y_field>", "type": "quantitative", "title": "<Y Label (units)>"},
        "color": {"field": "<group_field>", "type": "nominal"},
        "tooltip": [
          {"field": "<label_field>", "type": "nominal"},
          {"field": "<x_field>", "type": "quantitative"},
          {"field": "<y_field>", "type": "quantitative"}
        ]
      }
    },
    {
      "mark": {"type": "rule", "strokeDash": [4, 4], "color": "#666"},
      "encoding": {"x": {"datum": 0}}
    },
    {
      "mark": {"type": "rule", "strokeDash": [4, 4], "color": "#666"},
      "encoding": {"y": {"datum": 0}}
    }
  ]
}
```

**Key customisation:**
- Replace `"datum": 0` on both rules with meaningful threshold values to create quadrant boundaries.
- Add `"text"` mark layers for quadrant labels (e.g., "High X / High Y", "Low X / High Y").
- Use `"size"` encoding for a third dimension (e.g., ticket volume).

---

## Histogram

**When to use:** Show distribution of a continuous variable.
**KPI pattern:** Spread analysis — e.g., distribution of resolution times, distribution of dwell hours.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 500,
  "height": 300,
  "data": {
    "values": []
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "<value_field>", "bin": {"maxbins": 20}, "type": "quantitative", "title": "<Value Label (units)>"},
    "y": {"aggregate": "count", "type": "quantitative", "title": "Count"}
  }
}
```

**Key customisation:**
- Adjust `"maxbins"` for granularity (10 for overview, 30 for detailed distribution).
- Add a threshold `rule` layer for SLA/target lines.
- Use `"color"` to overlay distributions by group (e.g., dealer type).

---

## Bubble / Risk Matrix

**When to use:** Plot three dimensions simultaneously — volume, severity, and concentration — to surface which entities are both high-risk and high-impact.
**KPI pattern:** Cross-entity risk ranking — e.g., ticket type × resolution time × total hours × reopen rate.

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 620,
  "height": 380,
  "data": {
    "values": []
  },
  "layer": [
    {
      "mark": {"type": "circle", "opacity": 0.85},
      "encoding": {
        "x": {"field": "<volume_field>", "type": "quantitative", "title": "<Volume Label>"},
        "y": {"field": "<severity_field>", "type": "quantitative", "title": "<Severity Label (units)>"},
        "size": {
          "field": "<concentration_field>",
          "type": "quantitative",
          "title": "<Concentration Label>",
          "scale": {"range": [80, 2500]},
          "legend": {"orient": "bottom"}
        },
        "color": {
          "field": "<rate_field>",
          "type": "quantitative",
          "title": "<Rate Label>",
          "scale": {"scheme": "orangered", "domain": [0, 40]},
          "legend": {"orient": "bottom"}
        },
        "tooltip": [
          {"field": "<label_field>", "type": "nominal"},
          {"field": "<volume_field>", "type": "quantitative"},
          {"field": "<severity_field>", "type": "quantitative", "format": ".1f"},
          {"field": "<concentration_field>", "type": "quantitative", "format": ",.0f"},
          {"field": "<rate_field>", "type": "quantitative", "format": ".1f"}
        ]
      }
    },
    {
      "mark": {"type": "rule", "strokeDash": [5, 3], "color": "#6b7280", "size": 1},
      "encoding": {"y": {"datum": 0}}
    },
    {
      "data": {"values": []},
      "mark": {"type": "text", "dy": -14, "fontSize": 9, "fontWeight": "bold", "color": "#374151"},
      "encoding": {
        "x": {"field": "<volume_field>", "type": "quantitative"},
        "y": {"field": "<severity_field>", "type": "quantitative"},
        "text": {"field": "<label_field>", "type": "nominal"}
      }
    }
  ]
}
```

**Key customisation:**
- Replace `"datum": 0` on the reference rule with the fleet-average value for the y-axis metric.
- The third layer (text labels) should be a filtered subset — top 3 by concentration — to avoid clutter. Pass filtered data in that layer's `"data": {"values": [...]}`.
- Use `"scheme": "reds"` for a single bad-direction rate, or `"scheme": "blueorange"` for a bidirectional metric.
- Standard size: `width=620, height=380` — taller than bar charts to give vertical spread.
- In Altair/Python: use `chart1 + chart2 + chart3` layering; the third chart uses `_df.nlargest(3, "<concentration_field>")` for selective labels.

---

## Heatmap Scorecard (Cross-metric / Cross-entity)

**When to use:** Compare all entities across multiple metrics simultaneously. Normalise each column independently so the worst entity per metric stands out regardless of scale.
**KPI pattern:** Multi-metric summary — e.g., all ticket types × [avg resolution, reopen rate, avg actions, avg bounces].

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "<Chart Title>",
  "width": 500,
  "height": 280,
  "data": {
    "values": []
  },
  "mark": "rect",
  "encoding": {
    "x": {
      "field": "metric",
      "type": "nominal",
      "title": null,
      "axis": {"labelAngle": -20, "labelFontSize": 11}
    },
    "y": {
      "field": "entity",
      "type": "nominal",
      "sort": "-x",
      "title": null
    },
    "color": {
      "field": "norm_value",
      "type": "quantitative",
      "scale": {"scheme": "reds", "domain": [0, 1]},
      "legend": null
    },
    "tooltip": [
      {"field": "entity", "type": "nominal", "title": "Entity"},
      {"field": "metric", "type": "nominal", "title": "Metric"},
      {"field": "raw_value", "type": "quantitative", "title": "Value", "format": ".1f"},
      {"field": "norm_value", "type": "quantitative", "title": "Norm", "format": ".2f"}
    ]
  }
}
```

**Data preparation (Python):**
The chart requires long-form data with four columns: `entity`, `metric`, `norm_value` (0–1, column-normalised), `raw_value` (original scale).

```python
_metrics = ["metric_a", "metric_b", "metric_c"]
_df_sc = df[["entity_col"] + _metrics].copy()
for _m in _metrics:
    _col = _df_sc[_m].astype(float)
    _mn, _mx = _col.min(), _col.max()
    _df_sc[_m + "_norm"] = (_col - _mn) / (_mx - _mn) if _mx > _mn else 0.0

_long_rows = []
for _, _row in _df_sc.iterrows():
    for _m in _metrics:
        _long_rows.append({
            "entity":      _row["entity_col"],
            "metric":      _labels[_m],        # human-readable label dict
            "norm_value":  float(_row[_m + "_norm"]),
            "raw_value":   float(_row[_m]),
        })
_long = pd.DataFrame(_long_rows)

# Sort rows worst-first by total normalised score
_sort_order = (
    _long.groupby("entity")["norm_value"].sum()
    .sort_values(ascending=False).index.tolist()
)
```

**Key customisation:**
- Always normalise per column, not globally — cross-metric scales are incomparable.
- Sort rows by summed normalised score so the highest-risk entity appears at the top.
- Use `"scheme": "reds"` when all metrics are bad-direction (higher = worse).
- Use `"scheme": "blueorange"` when metrics have mixed directions (requires flipping the norm for good-direction metrics: `norm = 1 - norm`).
- Pair with a prose paragraph explaining which entities dominate and why the pattern matters.
