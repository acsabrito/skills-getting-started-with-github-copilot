from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_activities():
    original_activities = deepcopy(activities)
    yield
    activities.clear()
    activities.update(original_activities)


def test_get_activities_returns_activity_data():
    response = client.get("/activities")

    assert response.status_code == 200
    assert response.json() == activities


def test_signup_adds_participant():
    activity_name = "Basketball Club"
    email = "student@mergington.edu"

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": f"Signed up {email} for {activity_name}"
    }
    assert email in activities[activity_name]["participants"]


def test_signup_unknown_activity_returns_not_found():
    response = client.post(
        "/activities/Unknown%20Activity/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_full_activity_returns_bad_request():
    activity_name = "Basketball Club"
    activity = activities[activity_name]
    activity["participants"] = [
        f"student{index}@mergington.edu"
        for index in range(activity["max_participants"])
    ]

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": "additional@mergington.edu"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"


def test_unregister_removes_participant():
    activity_name = "Basketball Club"
    email = "student@mergington.edu"
    activities[activity_name]["participants"].append(email)

    response = client.delete(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": f"Unregistered {email} from {activity_name}"
    }
    assert email not in activities[activity_name]["participants"]


def test_unregister_unknown_activity_returns_not_found():
    response = client.delete(
        "/activities/Unknown%20Activity/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_missing_participant_returns_not_found():
    response = client.delete(
        "/activities/Basketball%20Club/signup",
        params={"email": "missing@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"
