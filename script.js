const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

window.addEventListener(
  "pointermove",
  (event) => {
    document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
    document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
  },
  { passive: true },
);

const briefForm = document.querySelector("[data-brief-form]");

if (briefForm instanceof HTMLFormElement) {
  const statusElement = briefForm.querySelector("[data-form-status]");

  briefForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = briefForm.querySelector("button[type='submit']");
    const formData = new FormData(briefForm);
    const payload = Object.fromEntries(formData.entries());

    payload.desired_actions = formData.getAll("desired_actions");
    payload.channels = formData.getAll("channels");

    if (statusElement) {
      statusElement.textContent = "Submitting your Gravity Brief...";
      statusElement.className = "form-status is-visible";
    }

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    try {
      const response = await fetch("/api/gravity-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Could not submit the brief.");
      }

      briefForm.reset();

      if (statusElement) {
        statusElement.textContent = "Brief received. We will review the gravity and respond with the next step.";
        statusElement.className = "form-status is-visible is-success";
      }
    } catch (error) {
      if (statusElement) {
        statusElement.textContent = error instanceof Error ? error.message : "Could not submit the brief.";
        statusElement.className = "form-status is-visible is-error";
      }
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Gravity Brief";
      }
    }
  });
}
