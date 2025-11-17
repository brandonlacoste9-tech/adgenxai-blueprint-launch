"""Testing worker for code validation."""

from __future__ import annotations

import ast
import os
import subprocess
import tempfile
from typing import Any, Dict

from colonyos.core.models import Task, Worker, WorkerCapability, WorkerStatus


class TestingWorker:
    """Worker specialized in running tests and validations."""

    def __init__(self, worker_id: str) -> None:
        self.worker_id = worker_id
        self.capabilities = [
            WorkerCapability(
                name="unit_testing",
                category="testing",
                supported_languages=["python", "javascript"],
                max_complexity=7,
            ),
            WorkerCapability(
                name="code_validation",
                category="testing",
                supported_languages=["python", "javascript", "typescript"],
                max_complexity=5,
            ),
        ]

        self.worker = Worker(
            id=worker_id,
            identity=None,
            capabilities=self.capabilities,
            status=WorkerStatus.IDLE,
        )

    async def execute_task(self, task: Task) -> Dict[str, Any]:
        test_type = task.requirements.get("test_type", "unit")
        if test_type == "unit":
            return await self._run_unit_tests(task)
        if test_type == "validation":
            return await self._validate_code(task)
        if test_type == "lint":
            return await self._lint_code(task)
        raise ValueError(f"Unknown test type: {test_type}")

    async def _run_unit_tests(self, task: Task) -> Dict[str, Any]:
        code = task.requirements.get("code")
        tests = task.requirements.get("tests")
        language = task.requirements.get("language", "python")
        if not code or not tests:
            return {"error": "Missing code or tests"}
        if language != "python":
            return {"error": f"Unsupported language: {language}"}
        return await self._run_python_tests(code, tests)

    async def _run_python_tests(self, code: str, tests: str) -> Dict[str, Any]:
        with tempfile.TemporaryDirectory() as tmpdir:
            code_file = os.path.join(tmpdir, "module.py")
            with open(code_file, "w", encoding="utf-8") as file:
                file.write(code)

            test_file = os.path.join(tmpdir, "test_module.py")
            with open(test_file, "w", encoding="utf-8") as file:
                file.write(tests)

            try:
                result = subprocess.run(
                    ["python", "-m", "pytest", test_file, "-v", "--tb=short"],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=tmpdir,
                )
                return {
                    "passed": result.returncode == 0,
                    "output": result.stdout,
                    "errors": result.stderr,
                    "exit_code": result.returncode,
                }
            except subprocess.TimeoutExpired:
                return {"passed": False, "error": "Test execution timeout"}
            except Exception as exc:  # pragma: no cover - runtime safeguard
                return {"passed": False, "error": str(exc)}

    async def _validate_code(self, task: Task) -> Dict[str, Any]:
        code = task.requirements.get("code", "")
        language = task.requirements.get("language", "python")
        if language == "python":
            return self._validate_python(code)
        return {"error": f"Unsupported language: {language}"}

    def _validate_python(self, code: str) -> Dict[str, Any]:
        issues = []
        try:
            tree = ast.parse(code)
            syntax_valid = True
        except SyntaxError as exc:
            syntax_valid = False
            issues.append({"type": "syntax_error", "line": exc.lineno, "message": str(exc)})

        if not syntax_valid:
            return {"valid": False, "issues": issues}

        has_functions = any(isinstance(node, ast.FunctionDef) for node in ast.walk(tree))
        has_classes = any(isinstance(node, ast.ClassDef) for node in ast.walk(tree))

        has_docstrings = any(
            ast.get_docstring(node) for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.ClassDef))
        )
        if not has_docstrings and (has_functions or has_classes):
            issues.append({"type": "warning", "message": "Missing docstrings"})

        return {
            "valid": True,
            "has_functions": has_functions,
            "has_classes": has_classes,
            "has_docstrings": has_docstrings,
            "issues": issues,
        }

    async def _lint_code(self, task: Task) -> Dict[str, Any]:
        code = task.requirements.get("code", "")
        language = task.requirements.get("language", "python")
        if language != "python":
            return {"error": f"Unsupported language: {language}"}
        return await self._lint_python(code)

    async def _lint_python(self, code: str) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as tmp:
            tmp.write(code)
            temp_file = tmp.name

        try:
            result = subprocess.run(
                ["python", "-m", "flake8", temp_file, "--max-line-length=100"],
                capture_output=True,
                text=True,
                timeout=10,
            )

            issues = [line for line in result.stdout.splitlines() if line.strip()]
            return {"passed": result.returncode == 0, "issues": issues, "issue_count": len(issues)}
        except Exception as exc:  # pragma: no cover - runtime safeguard
            return {"error": str(exc)}
        finally:
            os.unlink(temp_file)
