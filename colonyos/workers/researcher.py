"""Research and synthesis worker."""

from __future__ import annotations

from typing import Any, Dict, List

from colonyos.core.models import Task, Worker, WorkerCapability, WorkerStatus


class ResearchWorker:
    """Worker specialized in research and information synthesis."""

    def __init__(self, worker_id: str) -> None:
        self.worker_id = worker_id
        self.capabilities = [
            WorkerCapability(
                name="web_research",
                category="research",
                supported_languages=["english"],
                max_complexity=6,
            ),
            WorkerCapability(
                name="information_synthesis",
                category="analysis",
                supported_languages=["english"],
                max_complexity=7,
            ),
        ]

        self.worker = Worker(
            id=worker_id,
            identity=None,
            capabilities=self.capabilities,
            status=WorkerStatus.IDLE,
        )

    async def execute_task(self, task: Task) -> Dict[str, Any]:
        research_type = task.requirements.get("research_type", "web")
        if research_type == "web":
            return await self._web_research(task)
        if research_type == "synthesis":
            return await self._synthesize_information(task)
        raise ValueError(f"Unknown research type: {research_type}")

    async def _web_research(self, task: Task) -> Dict[str, Any]:
        query = task.description
        max_sources = task.requirements.get("max_sources", 5)

        sources = await self._search_web(query, max_sources)
        summaries = [await self._summarize_source(source) for source in sources]

        return {
            "query": query,
            "sources_found": len(sources),
            "summaries": summaries,
        }

    async def _search_web(self, query: str, max_results: int) -> List[Dict[str, str]]:
        return [
            {
                "url": f"https://example.com/article-{index}",
                "title": f"Article {index} about {query}",
                "snippet": f"This article discusses {query} in detail...",
            }
            for index in range(min(max_results, 3))
        ]

    async def _summarize_source(self, source: Dict[str, str]) -> Dict[str, Any]:
        return {
            "url": source["url"],
            "title": source["title"],
            "summary": source["snippet"],
            "relevance_score": 0.8,
        }

    async def _synthesize_information(self, task: Task) -> Dict[str, Any]:
        sources: List[str] = task.requirements.get("sources", [])
        if not sources:
            return {"error": "No sources provided"}

        key_points: List[str] = []
        for source in sources:
            key_points.extend(self._extract_key_points(source))

        themes = self._identify_themes(key_points)
        summary = self._generate_summary(themes)

        return {
            "total_sources": len(sources),
            "key_points": key_points,
            "themes": themes,
            "summary": summary,
        }

    def _extract_key_points(self, source: str) -> List[str]:
        sentences = [sentence.strip() for sentence in source.split(".") if sentence.strip()]
        return [f"{sentence}." for sentence in sentences[:3]]

    def _identify_themes(self, points: List[str]) -> Dict[str, List[str]]:
        themes: Dict[str, List[str]] = {}
        for point in points:
            theme = "general"
            lower_point = point.lower()
            if "technology" in lower_point:
                theme = "technology"
            elif "business" in lower_point:
                theme = "business"
            elif "science" in lower_point:
                theme = "science"

            themes.setdefault(theme, []).append(point)
        return themes

    def _generate_summary(self, themes: Dict[str, List[str]]) -> str:
        parts = [f"{theme.capitalize()}: {len(points)} key points identified." for theme, points in themes.items()]
        return " ".join(parts)
