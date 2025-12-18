import copy
from fastapi.testclient import TestClient

from src.app import app, activities


def client_with_reset():
    # Backup global activities state
    original = copy.deepcopy(activities)
    client = TestClient(app)

    class Ctx:
        client = client
        original = original

    try:
        yield Ctx()
    finally:
        # Restore original state so tests are isolated
        activities.clear()
        activities.update(original)


def test_get_activities():
    client = TestClient(app)
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Expect some known activity
    assert "Chess Club" in data


def test_signup_and_unregister_cycle():
    activity_name = "Chess Club"
    test_email = "test.user@example.com"

    # Backup and restore manually to isolate this test
    original = copy.deepcopy(activities)
    try:
        client = TestClient(app)

        # Signup
        res = client.post(f"/activities/{activity_name}/signup", params={"email": test_email})
        assert res.status_code == 200
        assert test_email in activities[activity_name]["participants"]

        # Unregister
        res2 = client.delete(f"/activities/{activity_name}/participants", params={"email": test_email})
        assert res2.status_code == 200
        assert test_email not in activities[activity_name]["participants"]
    finally:
        activities.clear()
        activities.update(original)
