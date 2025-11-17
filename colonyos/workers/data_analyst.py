"""Data analysis worker for datasets."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from colonyos.core.models import Task, Worker, WorkerCapability, WorkerStatus


class DataAnalystWorker:
    """Worker specialized in statistical data analysis."""

    def __init__(self, worker_id: str) -> None:
        self.worker_id = worker_id
        self.capabilities = [
            WorkerCapability(
                name="statistical_analysis",
                category="analysis",
                supported_languages=["python"],
                max_complexity=7,
            ),
            WorkerCapability(
                name="data_visualization",
                category="analysis",
                supported_languages=["python"],
                max_complexity=6,
            ),
        ]

        self.worker = Worker(
            id=worker_id,
            identity=None,
            capabilities=self.capabilities,
            status=WorkerStatus.IDLE,
        )

    async def execute_task(self, task: Task) -> Dict[str, Any]:
        analysis_type = task.requirements.get("analysis_type", "summary")
        if analysis_type == "summary":
            return await self._summarize_data(task)
        if analysis_type == "correlation":
            return await self._correlation_analysis(task)
        if analysis_type == "distribution":
            return await self._distribution_analysis(task)
        raise ValueError(f"Unknown analysis type: {analysis_type}")

    async def _summarize_data(self, task: Task) -> Dict[str, Any]:
        data = self._load_data(task)
        if data is None:
            return {"error": "Could not load data"}

        summary: Dict[str, Any] = {
            "row_count": len(data),
            "column_count": len(data.columns),
            "columns": list(data.columns),
            "dtypes": data.dtypes.astype(str).to_dict(),
            "missing_values": data.isnull().sum().to_dict(),
            "numeric_summary": {},
        }

        numeric_cols = data.select_dtypes(include=[np.number]).columns
        for column in numeric_cols:
            summary["numeric_summary"][column] = {
                "mean": float(data[column].mean()),
                "median": float(data[column].median()),
                "std": float(data[column].std()),
                "min": float(data[column].min()),
                "max": float(data[column].max()),
                "quartiles": {
                    str(q): float(val)
                    for q, val in data[column].quantile([0.25, 0.5, 0.75]).items()
                },
            }

        return summary

    async def _correlation_analysis(self, task: Task) -> Dict[str, Any]:
        data = self._load_data(task)
        if data is None:
            return {"error": "Could not load data"}

        numeric_data = data.select_dtypes(include=[np.number])
        corr_matrix = numeric_data.corr()

        strong_correlations: List[Dict[str, Any]] = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:
                    strong_correlations.append(
                        {
                            "var1": corr_matrix.columns[i],
                            "var2": corr_matrix.columns[j],
                            "correlation": float(corr_value),
                        }
                    )

        return {
            "correlation_matrix": corr_matrix.to_dict(),
            "strong_correlations": strong_correlations,
            "variables": list(corr_matrix.columns),
        }

    async def _distribution_analysis(self, task: Task) -> Dict[str, Any]:
        data = self._load_data(task)
        if data is None:
            return {"error": "Could not load data"}

        distributions: Dict[str, Dict[str, Any]] = {}
        for column in data.columns:
            if data[column].dtype in (np.int64, np.float64):
                distributions[column] = {
                    "type": "numeric",
                    "mean": float(data[column].mean()),
                    "std": float(data[column].std()),
                    "skewness": float(data[column].skew()),
                    "kurtosis": float(data[column].kurtosis()),
                }
            else:
                value_counts = data[column].value_counts()
                if value_counts.empty:
                    continue
                distributions[column] = {
                    "type": "categorical",
                    "unique_values": int(data[column].nunique()),
                    "top_values": value_counts.head(10).to_dict(),
                    "most_common": str(value_counts.index[0]),
                }

        return {"distributions": distributions}

    def _load_data(self, task: Task) -> Optional[pd.DataFrame]:
        data_source = task.requirements.get("data")

        if isinstance(data_source, str):
            try:
                if data_source.endswith(".csv"):
                    return pd.read_csv(data_source)
                if data_source.endswith(".json"):
                    return pd.read_json(data_source)
                parsed = json.loads(data_source)
                return pd.DataFrame(parsed)
            except Exception:  # pragma: no cover - defensive parsing
                return None

        if isinstance(data_source, dict):
            return pd.DataFrame([data_source])
        if isinstance(data_source, list):
            return pd.DataFrame(data_source)

        return None
