"""Core system tests for ColonyOS primitives."""

from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone

import pytest

from colonyos.core.event_bus import EventBus, InMemoryEventBus
from colonyos.core.memory import SQLiteMemory
from colonyos.core.types import (
    Identity,
    IdentityManager,
    Message,
    MessageType,
    Task,
    TaskStatus,
)


@pytest.fixture
def identity_manager() -> IdentityManager:
    return IdentityManager()


@pytest.fixture
def test_identity(identity_manager: IdentityManager) -> Identity:
    identity, _ = identity_manager.create_identity("test_user")
    return identity


class TestIdentity:
    def test_create_identity(self, identity_manager: IdentityManager) -> None:
        identity, private_key = identity_manager.create_identity("tester")
        assert identity.id
        assert identity.public_key
        assert private_key

    def test_sign_and_verify(self, identity_manager: IdentityManager, test_identity: Identity) -> None:
        message = b"colony-test"
        signature = identity_manager.sign_message(test_identity.id, message)
        assert signature
        assert test_identity.verify_signature(message, signature)
        assert not test_identity.verify_signature(b"wrong", signature)


class TestMessage:
    def test_message_creation(self, test_identity: Identity) -> None:
        msg = Message.create(MessageType.TASK_SUBMIT, test_identity.id, "worker", {"payload": 1})
        assert msg.id
        assert msg.correlation_id

    def test_message_signing(self, identity_manager: IdentityManager, test_identity: Identity) -> None:
        msg = Message.create(MessageType.TASK_SUBMIT, test_identity.id, "worker", {"payload": 1})
        msg.sign(identity_manager)
        assert msg.signature
        assert msg.verify(test_identity)

    def test_message_serialization(self, identity_manager: IdentityManager, test_identity: Identity) -> None:
        msg = Message.create(MessageType.TASK_SUBMIT, test_identity.id, "worker", {"payload": 1})
        msg.sign(identity_manager)
        payload = msg.to_wire_format()
        restored = Message.from_wire_format(payload)
        assert restored.id == msg.id
        assert restored.type == msg.type


class TestTask:
    def test_task_creation(self, test_identity: Identity) -> None:
        task = Task.create(description="demo", created_by=test_identity.id, requirements={"category": "test"}, priority=5)
        assert task.status == TaskStatus.PENDING
        assert task.created_at.tzinfo is not None

    def test_task_serialization(self, test_identity: Identity) -> None:
        task = Task.create(description="demo", created_by=test_identity.id)
        payload = task.to_wire_format()
        restored = Task.from_wire_format(payload)
        assert restored.id == task.id
        assert restored.description == task.description

    def test_task_retry_logic(self, test_identity: Identity) -> None:
        task = Task.create(description="retry", created_by=test_identity.id, max_retries=2)
        assert task.can_retry()
        task.retry_count = 2
        assert not task.can_retry()


class TestEventBus:
    def test_publish_subscribe(self) -> None:
        async def run():
            backend = InMemoryEventBus()
            bus = EventBus(backend)
            await bus.start()
            received = []

            async def handler(event):
                received.append(event)

            subscription_id = await bus.subscribe("demo", handler)
            await bus.publish("demo", {"value": 1}, "tests")
            await asyncio.sleep(0.1)
            assert len(received) == 1
            await bus.unsubscribe(subscription_id)
            await bus.stop()

        asyncio.run(run())

    def test_history(self) -> None:
        async def run():
            backend = InMemoryEventBus()
            bus = EventBus(backend)
            await bus.start()
            for idx in range(5):
                await bus.publish("demo", {"value": idx}, "tests")
            await asyncio.sleep(0.05)
            history = await bus.get_history("demo")
            assert len(history) == 5
            await bus.stop()

        asyncio.run(run())


class TestMemory:
    def test_sqlite_memory(self, tmp_path) -> None:
        db_path = tmp_path / "memory.db"
        memory = SQLiteMemory(str(db_path))
        memory.store("key", {"value": 1}, scope="tests")
        assert memory.retrieve("key", scope="tests") == {"value": 1}
        assert "key" in memory.list_keys(scope="tests")
        assert memory.delete("key", scope="tests")
        assert memory.retrieve("key", scope="tests") is None

    def test_memory_ttl(self, tmp_path) -> None:
        db_path = tmp_path / "memory.db"
        memory = SQLiteMemory(str(db_path))
        memory.store("key", "value", scope="tests", ttl=1)
        assert memory.retrieve("key", scope="tests") == "value"
        time.sleep(1.2)
        assert memory.retrieve("key", scope="tests") is None
