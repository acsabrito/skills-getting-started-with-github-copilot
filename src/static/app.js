document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    activitySelect.replaceChildren(activitySelect.options[0]);

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const heading = document.createElement("h4");
      heading.textContent = name;

      const description = document.createElement("p");
      description.textContent = details.description;

      const schedule = document.createElement("p");
      const scheduleLabel = document.createElement("strong");
      scheduleLabel.textContent = "Schedule: ";
      schedule.append(scheduleLabel, details.schedule);

      const availability = document.createElement("p");
      availability.className = "availability";
      availability.textContent = `${spotsLeft} spots left`;

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = `Participants (${details.participants.length})`;

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";

      if (details.participants.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "no-participants";
        emptyMessage.textContent = "No participants yet";
        participantsList.appendChild(emptyMessage);
      } else {
        details.participants.forEach((participant) => {
          const participantItem = document.createElement("li");
          const participantEmail = document.createElement("span");
          participantEmail.textContent = participant;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant-button";
          removeButton.setAttribute(
            "aria-label",
            `Unregister ${participant} from ${name}`
          );
          removeButton.title = "Unregister participant";

          const deleteIcon = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );
          deleteIcon.setAttribute("viewBox", "0 0 24 24");
          deleteIcon.setAttribute("aria-hidden", "true");
          deleteIcon.setAttribute("focusable", "false");
          const deletePath = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          deletePath.setAttribute(
            "d",
            "M9 3h6l1 2h5v2H3V5h5l1-2Zm-3 6h12l-1 12H7L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z"
          );
          deleteIcon.appendChild(deletePath);
          removeButton.appendChild(deleteIcon);
          removeButton.addEventListener("click", () => {
            unregisterParticipant(name, participant, removeButton);
          });

          participantItem.append(participantEmail, removeButton);
          participantsList.appendChild(participantItem);
        });
      }

      activityCard.append(
        heading,
        description,
        schedule,
        availability,
        participantsHeading,
        participantsList
      );
      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function unregisterParticipant(activity, email, button) {
    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        messageDiv.textContent = result.detail || "Unable to unregister participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        button.disabled = false;
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
        return;
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");
      await fetchActivities();
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      button.disabled = false;
      console.error("Error unregistering participant:", error);
    }

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
