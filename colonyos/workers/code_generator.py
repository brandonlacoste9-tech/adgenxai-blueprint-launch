"""Code generation worker backed by an LLM."""

from __future__ import annotations

import ast
from typing import Any, Dict, List, Optional

from colonyos.core.models import (
    Identity,
    Task,
    Worker,
    WorkerCapability,
    WorkerStatus,
)


class CodeGeneratorWorker:
    """Worker specialized in code generation and refactoring."""

    def __init__(self, worker_id: str, llm_client: Optional[Any] = None) -> None:
        self.worker_id = worker_id
        self.llm_client = llm_client

        self.capabilities = [
            WorkerCapability(
                name="code_generation",
                category="generation",
                supported_languages=["python", "javascript", "typescript", "go"],
                max_complexity=8,
            ),
            WorkerCapability(
                name="code_refactoring",
                category="transformation",
                supported_languages=["python", "javascript"],
                max_complexity=6,
            ),
        ]

        self.worker = Worker(
            id=worker_id,
            identity=None,
            capabilities=self.capabilities,
            status=WorkerStatus.IDLE,
        )

    def set_identity(self, identity: Identity) -> None:
        """Attach an identity to the worker."""

        self.worker.identity = identity

    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a code generation or refactor task."""

        task_type = task.requirements.get("category")
        if task_type == "generation":
            return await self._generate_code(task)
        if task_type == "refactoring":
            return await self._refactor_code(task)
        raise ValueError(f"Unsupported task type: {task_type}")

    async def _generate_code(self, task: Task) -> Dict[str, Any]:
        language = task.requirements.get("language", "python")
        description = task.description

        prompt = (
            f"Generate {language} code for the following requirement:\n\n"
            f"{description}\n\n"
            "Requirements:\n"
            "- Write clean, well-documented code\n"
            "- Include error handling\n"
            "- Follow best practices\n"
            "- Add inline comments\n\n"
            "Code:"
        )

        if self.llm_client:
            code = await self._call_llm(prompt)
        else:
            code = self._fallback_generation(description, language)

        is_valid, error = self._validate_code(code, language)
        return {
            "code": code,
            "language": language,
            "valid": is_valid,
            "validation_error": error,
            "lines": len(code.splitlines()),
        }

    async def _refactor_code(self, task: Task) -> Dict[str, Any]:
        original_code = task.requirements.get("code", "")
        language = task.requirements.get("language", "python")
        refactor_goal = task.description

        prompt = (
            f"Refactor the following {language} code:\n\n"
            f"Goal: {refactor_goal}\n\n"
            f"Original code:\n```{language}\n{original_code}\n```\n\n"
            "Provide refactored code with improvements:"
        )

        if self.llm_client:
            refactored = await self._call_llm(prompt)
        else:
            refactored = original_code

        return {
            "original_code": original_code,
            "refactored_code": refactored,
            "language": language,
            "improvements": self._analyze_improvements(original_code, refactored),
        }

    def _validate_code(self, code: str, language: str) -> tuple[bool, Optional[str]]:
        if language == "python":
            try:
                ast.parse(code)
                return True, None
            except SyntaxError as exc:
                return False, str(exc)

        if not code.strip():
            return False, "Empty code"
        return True, None

    def _analyze_improvements(self, original: str, refactored: str) -> List[str]:
        improvements: List[str] = []

        orig_lines = len(original.splitlines())
        new_lines = len(refactored.splitlines())
        if refactored and new_lines < orig_lines:
            improvements.append(f"Reduced from {orig_lines} to {new_lines} lines")

        orig_comments = original.count("#")
        new_comments = refactored.count("#")
        if new_comments > orig_comments:
            improvements.append(f"Added {new_comments - orig_comments} comments")

        return improvements

    async def _call_llm(self, prompt: str) -> str:
        if not self.llm_client:
            raise RuntimeError("LLM client not configured")
        return await self.llm_client.complete(prompt)

    def _fallback_generation(self, description: str, language: str) -> str:
        if language == "python":
            return (
                "def solution():\n"
                "    \"\"\"\n"
                f"    {description}\n"
                "    \"\"\"\n"
                "    # TODO: Implement this function\n"
                "    raise NotImplementedError()\n\n"
                "if __name__ == \"__main__\":\n"
                "    solution()\n"
            )
        return f"// TODO: {description}\n"
