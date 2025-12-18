document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    messageDiv.setAttribute("role", "status");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Remove previously generated options (keep placeholder)
      activitySelect.querySelectorAll('option[data-generated="true"]').forEach((o) => o.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        let participantsSection = "";
        if (details.participants && details.participants.length > 0) {
          participantsSection = `
            <div class="participants-container">
              <strong>Participants (${details.participants.length}):</strong>
              <ul class="participant-list">
                ${details.participants
                  .map(
                    (p) =>
                      `<li><span class="participant-email">${p}</span> <button class="delete-btn" data-email="${p}">✖</button></li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsSection = `<p class="participant-empty">No participants yet.</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsSection}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for each participant button (optimistic UI)
        activityCard.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const email = btn.getAttribute('data-email');
            if (!confirm(`Unregister ${email} from ${name}?`)) return;

            const li = btn.closest('li');
            const parentUl = li ? li.parentElement : null;
            const nextSibling = li ? li.nextSibling : null;
            // Backup node so we can restore on failure
            const backup = li ? li.cloneNode(true) : null;

            // Optimistically remove from DOM immediately
            if (li) li.remove();

            try {
              const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
              const result = await res.json();
              if (!res.ok) {
                // Restore backup on failure
                if (parentUl && backup) {
                  if (nextSibling) parentUl.insertBefore(backup, nextSibling);
                  else parentUl.appendChild(backup);
                }
                console.error('Failed to unregister:', result);
                alert(result.detail || 'Failed to unregister participant');
              }
            } catch (err) {
              // Restore backup on error
              if (parentUl && backup) {
                if (nextSibling) parentUl.insertBefore(backup, nextSibling);
                else parentUl.appendChild(backup);
              }
              console.error('Error unregistering participant:', err);
              alert('Error unregistering participant');
            }
          });
        });

        // Add option to select dropdown
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  option.setAttribute("data-generated", "true");
  activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    if (!email || !activity) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
<<<<<<< HEAD
        // Refresh activities so the new participant appears immediately
=======
        // Refresh activities to show updated participants
>>>>>>> 291ff2ce7c0f834264df0547c1d6f27bd3b30de5
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
