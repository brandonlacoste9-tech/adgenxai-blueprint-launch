"""Streamlit monitoring dashboard for ColonyOS."""

from __future__ import annotations

import time
from typing import Dict, List

import pandas as pd
import requests
import streamlit as st

# Configure page
st.set_page_config(page_title="ColonyOS Dashboard", page_icon="🐝", layout="wide")


class DashboardClient:
    """Small helper for retrieving data from the ColonyOS API."""

    def __init__(self, base_url: str, token: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {token}"}

    def get_stats(self) -> Dict[str, any]:
        response = requests.get(f"{self.base_url}/system/stats", headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_tasks(self, limit: int = 100) -> List[Dict[str, any]]:
        response = requests.get(f"{self.base_url}/tasks", params={"limit": limit}, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_workers(self) -> List[Dict[str, any]]:
        response = requests.get(f"{self.base_url}/workers", headers=self.headers)
        response.raise_for_status()
        return response.json()


st.sidebar.title("🐝 ColonyOS")
st.sidebar.markdown("---")
api_url = st.sidebar.text_input("API URL", "http://localhost:8000")
api_token = st.sidebar.text_input("Token", type="password")

if not api_token:
    st.warning("Please enter API token in sidebar")
    st.stop()

client = DashboardClient(api_url, api_token)
refresh_interval = st.sidebar.slider("Refresh interval (s)", 1, 30, 5)
auto_refresh = st.sidebar.checkbox("Auto-refresh", value=True)

st.title("ColonyOS Dashboard")

try:
    stats = client.get_stats()
    tasks = client.get_tasks()
    workers = client.get_workers()
except Exception as exc:  # pragma: no cover - UI feedback
    st.error(f"Error fetching data: {exc}")
    st.stop()

col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Total Workers", stats["workers"].get("total_workers", 0), delta=f"{stats['workers'].get('available', 0)} available")
with col2:
    st.metric("Active Tasks", stats["tasks"]["by_status"].get("executing", 0), delta=f"{stats['tasks']['by_status'].get('queued', 0)} queued")
with col3:
    success_rate = stats["workers"].get("overall_success_rate", 0)
    st.metric("Success Rate", f"{success_rate:.1%}")
with col4:
    uptime_hours = int(stats.get("uptime_seconds", 0) // 3600)
    st.metric("Uptime", f"{uptime_hours}h")

st.markdown("---")

col1, col2 = st.columns(2)
with col1:
    st.subheader("Task Status Distribution")
    status_data = stats["tasks"]["by_status"]
    if status_data:
        st.bar_chart(status_data)
with col2:
    st.subheader("Worker Availability")
    worker_data = {"Available": stats["workers"].get("available", 0), "Busy": stats["workers"].get("busy", 0)}
    st.bar_chart(worker_data)

st.subheader("Recent Tasks")
if tasks:
    task_df = pd.DataFrame(tasks)
    task_df["created_at"] = pd.to_datetime(task_df["created_at"])
    st.dataframe(task_df[["id", "description", "status", "assigned_worker", "created_at"]].head(10), use_container_width=True)

st.subheader("Registered Workers")
if workers:
    worker_df = pd.DataFrame(workers)
    st.dataframe(worker_df[["id", "name", "status", "current_task"]], use_container_width=True)

queue_stats = stats["kernel"]["queue"]
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Avg Wait Time", f"{queue_stats['avg_wait_time']:.1f}s")
with col2:
    st.metric("Avg Execution Time", f"{queue_stats['avg_execution_time']:.1f}s")
with col3:
    st.metric("Queue Size", queue_stats["current_queue_size"])

if auto_refresh:
    time.sleep(refresh_interval)
    st.experimental_rerun()
