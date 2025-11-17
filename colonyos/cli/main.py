"""Command-line interface for ColonyOS."""

from __future__ import annotations

import json
import time
from datetime import datetime
from typing import Dict, List, Optional

import click
import requests
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.progress import Progress
from rich.syntax import Syntax
from rich.table import Table

console = Console()


class ColonyClient:
    """HTTP client used by the CLI to communicate with ColonyOS."""

    def __init__(self, base_url: str, token: Optional[str] = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        if token:
            self.session.headers["Authorization"] = f"Bearer {token}"

    def submit_task(self, description: str, **payload) -> Dict[str, any]:
        response = self.session.post(f"{self.base_url}/tasks", json={"description": description, **payload})
        response.raise_for_status()
        return response.json()

    def get_task(self, task_id: str) -> Dict[str, any]:
        response = self.session.get(f"{self.base_url}/tasks/{task_id}")
        response.raise_for_status()
        return response.json()

    def list_tasks(self, status: Optional[str] = None) -> List[Dict[str, any]]:
        params = {"status": status} if status else None
        response = self.session.get(f"{self.base_url}/tasks", params=params)
        response.raise_for_status()
        return response.json()

    def list_workers(self) -> List[Dict[str, any]]:
        response = self.session.get(f"{self.base_url}/workers")
        response.raise_for_status()
        return response.json()

    def get_stats(self) -> Dict[str, any]:
        response = self.session.get(f"{self.base_url}/system/stats")
        response.raise_for_status()
        return response.json()


@click.group()
@click.option("--url", default="http://localhost:8000", help="ColonyOS API URL")
@click.option("--token", envvar="COLONY_TOKEN", help="Authentication token")
@click.pass_context
def cli(ctx: click.Context, url: str, token: Optional[str]) -> None:
    ctx.ensure_object(dict)
    ctx.obj["client"] = ColonyClient(url, token)


@cli.command()
@click.argument("description")
@click.option("--priority", default=5, type=int, help="Task priority (0-10)")
@click.option("--timeout", default=300, type=int, help="Timeout in seconds")
@click.option("--wait", is_flag=True, help="Wait for task completion")
@click.pass_context
def submit(ctx: click.Context, description: str, priority: int, timeout: int, wait: bool) -> None:
    client: ColonyClient = ctx.obj["client"]
    with console.status("[bold green]Submitting task..."):
        task = client.submit_task(description=description, priority=priority, timeout_seconds=timeout)
    console.print(f"[green]✓[/green] Task submitted: {task['id']}")
    if wait:
        with Progress() as progress:
            task_progress = progress.add_task("[cyan]Executing...", total=None)
            while True:
                current = client.get_task(task["id"])
                if current["status"] in {"completed", "failed", "cancelled", "timeout"}:
                    progress.stop()
                    break
                time.sleep(1)
        if current["status"] == "completed":
            console.print("\n[green]✓ Task completed[/green]")
            if current.get("result"):
                console.print(Panel(json.dumps(current["result"], indent=2)))
        else:
            console.print(f"\n[red]✗ Task {current['status']}[/red]")
            if current.get("error"):
                console.print(f"Error: {current['error']}")


@cli.command()
@click.option("--status", help="Filter by status")
@click.option("--limit", default=20, type=int, help="Maximum results")
@click.pass_context
def tasks(ctx: click.Context, status: Optional[str], limit: int) -> None:
    client: ColonyClient = ctx.obj["client"]
    with console.status("[bold green]Fetching tasks..."):
        task_list = client.list_tasks(status=status)
    if not task_list:
        console.print("[yellow]No tasks found[/yellow]")
        return
    table = Table(title="Tasks")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Description", style="white")
    table.add_column("Status", style="magenta")
    table.add_column("Worker", style="green")
    table.add_column("Created", style="blue")
    for task in task_list[:limit]:
        table.add_row(
            task["id"][:8] + "...",
            task["description"][:50] + ("..." if len(task["description"]) > 50 else ""),
            task["status"],
            (task.get("assigned_worker", "-") or "-")[:8] + "..." if task.get("assigned_worker") else "-",
            datetime.fromisoformat(task["created_at"]).strftime("%Y-%m-%d %H:%M"),
        )
    console.print(table)


@cli.command()
@click.argument("task_id")
@click.pass_context
def get(ctx: click.Context, task_id: str) -> None:
    client: ColonyClient = ctx.obj["client"]
    with console.status(f"[bold green]Fetching task {task_id}..."):
        task = client.get_task(task_id)
    console.print(Panel(f"[bold]Task: {task['id']}[/bold]"))
    console.print(f"\n[cyan]Description:[/cyan] {task['description']}")
    console.print(f"[cyan]Status:[/cyan] {task['status']}")
    console.print(f"[cyan]Created:[/cyan] {task['created_at']}")
    console.print(f"[cyan]Created by:[/cyan] {task['created_by']}")
    if task.get("assigned_worker"):
        console.print(f"[cyan]Worker:[/cyan] {task['assigned_worker']}")
    if task.get("result"):
        console.print("\n[cyan]Result:[/cyan]")
        console.print(Syntax(json.dumps(task["result"], indent=2), "json"))
    if task.get("error"):
        console.print("\n[red]Error:[/red]")
        console.print(Panel(task["error"], style="red"))


@cli.command()
@click.pass_context
def workers(ctx: click.Context) -> None:
    client: ColonyClient = ctx.obj["client"]
    with console.status("[bold green]Fetching workers..."):
        worker_list = client.list_workers()
    if not worker_list:
        console.print("[yellow]No workers registered[/yellow]")
        return
    table = Table(title="Workers")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Name", style="white")
    table.add_column("Status", style="magenta")
    table.add_column("Capabilities", style="green")
    table.add_column("Current Task", style="blue")
    for worker in worker_list:
        table.add_row(
            worker["id"][:8] + "...",
            worker["name"],
            worker["status"],
            f"{len(worker['capabilities'])} capabilities",
            (worker.get("current_task") or "-")[:8] + "..." if worker.get("current_task") else "-",
        )
    console.print(table)


@cli.command()
@click.pass_context
def stats(ctx: click.Context) -> None:
    client: ColonyClient = ctx.obj["client"]
    with console.status("[bold green]Fetching statistics..."):
        stats_data = client.get_stats()
    console.print(Panel("[bold]ColonyOS System Statistics[/bold]"))
    workers = stats_data["workers"]
    console.print("\n[cyan]Workers:[/cyan]")
    console.print(f"  Total: {workers['total_workers']}")
    console.print(f"  Available: {workers['available']}")
    console.print(f"  Busy: {workers['busy']}")
    tasks = stats_data["tasks"]
    console.print("\n[cyan]Tasks:[/cyan]")
    console.print(f"  Total: {tasks['total']}")
    if tasks.get("by_status"):
        for status, count in tasks["by_status"].items():
            console.print(f"    {status}: {count}")
    queue = stats_data["kernel"]["queue"]
    console.print("\n[cyan]Queue:[/cyan]")
    console.print(f"  Current size: {queue['current_queue_size']}")
    console.print(f"  Total enqueued: {queue['total_enqueued']}")
    console.print(f"  Completed: {queue['total_completed']}")
    console.print(f"  Failed: {queue['total_failed']}")
    console.print(f"  Avg wait time: {queue['avg_wait_time']:.1f}s")
    uptime = stats_data["uptime_seconds"]
    hours = int(uptime // 3600)
    minutes = int((uptime % 3600) // 60)
    console.print(f"\n[cyan]Uptime:[/cyan] {hours}h {minutes}m")


@cli.command()
@click.option("--interval", default=2, type=int, help="Refresh interval in seconds")
@click.pass_context
def monitor(ctx: click.Context, interval: int) -> None:
    client: ColonyClient = ctx.obj["client"]

    def generate_dashboard() -> Layout:
        stats_data = client.get_stats()
        workers = stats_data["workers"]
        tasks = stats_data["tasks"]
        queue = stats_data["kernel"]["queue"]
        workers_panel = Panel(
            f"Total: {workers['total_workers']}\nAvailable: {workers['available']}\nBusy: {workers['busy']}",
            title="Workers",
            border_style="green",
        )
        tasks_summary = "Total: {total}".format(total=tasks["total"])
        if tasks.get("by_status"):
            for status, count in tasks["by_status"].items():
                tasks_summary += f"\n{status}: {count}"
        tasks_panel = Panel(tasks_summary, title="Tasks", border_style="cyan")
        queue_panel = Panel(
            f"Queue Size: {queue['current_queue_size']}\nEnqueued: {queue['total_enqueued']}\nCompleted: {queue['total_completed']}\nFailed: {queue['total_failed']}\nAvg Wait: {queue['avg_wait_time']:.1f}s",
            title="Queue",
            border_style="yellow",
        )
        layout = Layout()
        layout.split_column(Layout(Panel("[bold]ColonyOS Live Monitor[/bold]", style="blue"), size=3), Layout(name="main"))
        layout["main"].split_row(workers_panel, tasks_panel, queue_panel)
        return layout

    with Live(generate_dashboard(), refresh_per_second=max(1, 1 // max(interval, 1))) as live:
        try:
            while True:
                time.sleep(interval)
                live.update(generate_dashboard())
        except KeyboardInterrupt:
            console.print("\n[yellow]Monitoring stopped[/yellow]")


if __name__ == "__main__":
    cli()
