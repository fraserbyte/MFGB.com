/* ============================================================
   Messerschmitt Foundation of Great Britain — app.js
   Vanilla JavaScript for dynamic UI, navigation & ScrollSpy.
   ------------------------------------------------------------
   Modules:
   01. Navigation Drawer Toggle (ARIA-managed mobile menu)
   02. Active Page Highlighting (current tab in the header nav)
   03. Contact Form Handler (client-side validation + feedback)
   04. Back-to-Top Observer
   05. Canopy Door Toggle (glassmorphism exhibit card)
   06. Ignition Key Theme Toggle (Night Drive Dark)
   08. Engine Rev Indicator
   09. Home Hero Photograph Deck (shuffling stack in the home hero)
   10. Initialisation
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     01. Navigation Drawer Toggle
     ============================================================ */
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");

  // Below this width the header shows the drawer rather than the row of
  // tabs. Keep it in step with the breakpoint in styles.css (the
  // horizontal navigation appears in the > 1024px block).
  const DESKTOP_NAV = "(min-width: 1025px)";

  function setNavState(isOpen) {
    navToggle.setAttribute("aria-expanded", String(isOpen));
    mainNav.setAttribute("aria-hidden", String(!isOpen));
    mainNav.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Toggle navigation");

    // The drawer scrolls on its own; freezing the page behind it stops
    // the layout scrolling away under an open menu, and drives the
    // dimmer in the stylesheet.
    const lock = isOpen && !window.matchMedia(DESKTOP_NAV).matches;
    document.body.classList.toggle("nav-is-open", lock);
    document.body.style.overflow = lock ? "hidden" : "";
  }

  function initNavToggle() {
    if (!navToggle || !mainNav) return;

    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setNavState(!isOpen);
    });

    // Close the drawer when a navigation link is chosen (mobile).
    mainNav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (navToggle.getAttribute("aria-expanded") === "true") {
          setNavState(false);
        }
      });
    });

    // Tapping the dimmed page behind the drawer closes it, which is
    // what a thumb reaches for before it finds the ✕.
    document.addEventListener("click", (event) => {
      if (navToggle.getAttribute("aria-expanded") !== "true") return;
      const target = event.target;
      if (!(target instanceof Element) || target.closest("#main-nav, #nav-toggle")) return;
      setNavState(false);
    });

    // Close on Escape and return focus to the toggle for keyboard users.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setNavState(false);
        navToggle.focus();
      }
    });

    // Reset the drawer state when resizing to a desktop layout.
    window.addEventListener("resize", () => {
      if (window.matchMedia(DESKTOP_NAV).matches) {
        setNavState(false);
      }
    });
  }

  /* ============================================================
     02. Active Page Highlighting
     ============================================================ */
  function initActiveNav() {
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    if (navLinks.length === 0) return;

    // Determine the current page from the URL path, defaulting to the
    // home page for root paths. Works for both http(s):// and file://.
    const rawPage = window.location.pathname.split("/").pop() || "index.html";
    const currentPage = rawPage.replace(/\.html$/, "") || "index";

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const linkPage = href.replace(/\.html$/, "").split("#")[0];
      const isActive = linkPage === currentPage;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /* ============================================================
     03. Historical Scroll Spotlight
     ============================================================ */
  function initHistorySpotlight() {
    const spotlightImage = document.getElementById("history-spotlight-image");
    const spotlightImageNext = document.getElementById("history-spotlight-image-next");
    const timelineItems = Array.from(document.querySelectorAll(".timeline-item"));
    const timeline = document.querySelector(".timeline");
    if (!spotlightImage || timelineItems.length === 0) return;

    // Two stacked layers let the incoming image wipe down from the top edge
    // while the outgoing image fades out beneath it — a fade in / fade out
    // transition that travels from top to bottom.
    let front = spotlightImage;    // layer currently on screen
    let back = spotlightImageNext; // off-screen buffer that enters next
    let swapTimer = null;
    let loadToken = 0;

    if (back) {
      back.style.opacity = "0";
      back.style.clipPath = "inset(0 0 100% 0)";
    }

    const setActiveImage = (nextSrc) => {
      if (!nextSrc || !back) return;
      if (front.getAttribute("src") === nextSrc || back.getAttribute("src") === nextSrc) return;

      // Only the most recent request may apply, so fast scrolling cannot
      // let an older preload clobber the current image.
      const token = ++loadToken;
      if (swapTimer) window.clearTimeout(swapTimer);

      // Preload first so the wipe never shows a half-drawn image.
      const preloader = new Image();
      preloader.onload = () => {
        if (token !== loadToken) return;

        back.src = nextSrc;
        back.classList.add("is-enter"); // raise layer + enable clip-path transition
        back.style.transition = "none"; // snap to the hidden start state
        back.style.clipPath = "inset(0 0 100% 0)";
        back.style.opacity = "0";
        void back.offsetWidth; // force reflow so the start state applies
        back.style.transition = "";
        // Reveal from the top edge downward while fading in.
        back.style.clipPath = "inset(0 0 0 0)";
        back.style.opacity = "0.96";
        // Fade the previous image out underneath.
        front.style.opacity = "0";

        swapTimer = window.setTimeout(() => {
          // Promote the entering layer; demote the outgoing one to the buffer.
          front.classList.remove("is-front");
          front.style.opacity = "0";
          front.style.clipPath = "inset(0 0 100% 0)";
          back.classList.remove("is-enter");
          back.classList.add("is-front");
          const prev = front;
          front = back;
          back = prev;
          swapTimer = null;
        }, 240);
      };
      preloader.onerror = () => {
        /* keep the current image on load failure */
      };
      preloader.src = nextSrc;
    };

    let activeItem = null;

    const setActiveItem = (item) => {
      if (!item || item === activeItem) return;
      activeItem = item;

      timelineItems.forEach((entry) => {
        entry.classList.toggle("is-active", entry === item);
      });

      setActiveImage(item.dataset.image);
    };

    const updateActiveFromScroll = () => {
      const viewportAnchor = window.innerHeight * 0.42;
      let currentItem = timelineItems[0];

      // The active year is the last item whose dot has reached (risen
      // above) the anchor line — so each image "pops" as its dot arrives.
      timelineItems.forEach((item) => {
        const marker = item.querySelector(".timeline-marker");
        const rect = item.getBoundingClientRect();
        const markerCenter = marker
          ? marker.getBoundingClientRect().top + marker.getBoundingClientRect().height / 2
          : rect.top + 24;
        if (markerCenter <= viewportAnchor) {
          currentItem = item;
        }
      });

      setActiveItem(currentItem);
    };

    const updateLineProgress = () => {
      if (!timeline) return;
      const tl = timeline.getBoundingClientRect();
      // Same reference line that triggers the image pop-in.
      const anchor = window.innerHeight * 0.42;

      // Measure against the LAST dot so the fill stops exactly at it and
      // never runs past the end of the bar.
      const lastItem = timelineItems[timelineItems.length - 1];
      const lastMarker = lastItem ? lastItem.querySelector(".timeline-marker") : null;
      const lastDotOffset = lastMarker
        ? lastMarker.getBoundingClientRect().top + lastMarker.getBoundingClientRect().height / 2 - tl.top
        : tl.height;

      const progress = lastDotOffset > 0 ? Math.min(Math.max((anchor - tl.top) / lastDotOffset, 0), 1) : 0;
      timeline.style.setProperty("--progress", String(progress));
      timeline.style.setProperty("--dot-end", lastDotOffset + "px");
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveFromScroll();
          updateLineProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateActiveFromScroll();
    updateLineProgress();
  }

  /* ============================================================
     03b. History Page Scroll Slowdown + Smoothing
     (Slows the mouse-wheel scroll and glides it toward a target
     position for a smooth, flowing feel. Touch/trackpad scrolling
     is left untouched.)
     ============================================================ */
  function initHistoryScrollSlowdown() {
    if (document.body.dataset.page !== "history") return;

    // Distance travelled per wheel tick is scaled by this factor.
    const SLOWDOWN = 0.5;

    // Easing applied toward the target position each frame (0-1).
    const SMOOTHING = 0.12;

    let targetY = window.scrollY;
    let rafId = null;

    const step = () => {
      const currentY = window.scrollY;
      const nextY = currentY + (targetY - currentY) * SMOOTHING;

      if (Math.abs(targetY - currentY) < 0.5) {
        window.scrollTo({ top: targetY, behavior: "instant" });
        rafId = null;
        return;
      }

      window.scrollTo({ top: nextY, behavior: "instant" });
      rafId = window.requestAnimationFrame(step);
    };

    const startGlide = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(step);
    };

    window.addEventListener(
      "wheel",
      (event) => {
        // Preserve pinch-to-zoom gestures.
        if (event.ctrlKey) return;

        const base =
          event.deltaMode === 1 ? 16 : // lines -> pixels
          event.deltaMode === 2 ? window.innerHeight : // pages -> pixels
          1; // already pixels

        event.preventDefault();

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        targetY = Math.min(
          Math.max(targetY + event.deltaY * base * SLOWDOWN, 0),
          maxScroll
        );
        startGlide();
      },
      { passive: false }
    );
  }

  /* ============================================================
     04. Contact Form Handler
     ============================================================ */
  const form = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  /* Where enquiries from the contact form are delivered.

     This site is static — nginx serves files and nothing more, so there is no
     server here that a form POST could reach. With `endpoint` empty the form
     therefore offers the visitor a choice of where to send from — see
     COMPOSE_CHANNELS below. Each choice opens a new tab holding the enquiry
     already written, which keeps the cost and the third party at zero and means
     the message arrives from the visitor's real address, so a reply goes
     straight back to them.

     TO SWITCH TO IN-PAGE DELIVERY — the visitor never leaves the site — fill
     in the two blank lines of the object below:

       1. Go to https://web3forms.com and enter karofahrer@yahoo.co.uk.
          There is no password and no account to create: the access key is
          emailed to that address, usually within a minute.
       2. Set `endpoint` to "https://api.web3forms.com/submit".
       3. Paste the key into `accessKey`.

     The key is NOT a secret. It only routes mail to the address it was created
     for, so it is safe in a public repository — the worst an attacker can do
     with it is send the Foundation more email. Spam is therefore the only real
     risk, which is what the decoy field in the markup is for.

     Both fields must be filled: with `endpoint` empty the form keeps handing
     enquiries to the visitor's email app instead, so the site is never left in
     a state where a submitted enquiry goes nowhere.

     Formspree works too, but names two fields differently — rename `subject`
     to `_subject` and `email` to `_replyto` in sendViaEndpoint below. */
  const CONTACT_DELIVERY = {
    email: "karofahrer@yahoo.co.uk",
    endpoint: "", // "https://api.web3forms.com/submit" to go live
    accessKey: "" // the key that arrives by email
  };

  const ENQUIRY_RECEIVED =
    "Thank you — your enquiry has been received. We will reply within 5 working days.";

  /* The <option value> is what the form sends; this is what a human reads. */
  const SUBJECT_LABELS = {
    general: "General Inquiry",
    verification: "Vehicle Verification",
    "exhibit-access": "Exhibit Access",
    technical: "Technical Assistance"
  };

  function composeEnquiry(formData) {
    const name = formData.get("full-name").trim();
    const email = formData.get("email").trim();
    const message = formData.get("message").trim();
    const label = SUBJECT_LABELS[formData.get("subject-type")] || "General Inquiry";

    return {
      name: name,
      email: email,
      label: label,
      message: message,
      subject: label + " - website enquiry from " + name,
      body: [
        "Name: " + name,
        "Email: " + email,
        "Subject: " + label,
        "",
        message,
        "",
        "--",
        "Sent from the contact form at mfbg.com"
      ].join("\r\n")
    };
  }

  function sendViaEndpoint(enquiry) {
    /* Field names below are Web3Forms' documented names. `email` doubles as the
       reply-to unless `replyto` is sent, which is what we want: the Foundation
       presses Reply and reaches the visitor. `from_name` is what shows in the
       inbox instead of the default "Notifications". */
    const payload = {
      access_key: CONTACT_DELIVERY.accessKey,
      subject: enquiry.subject,
      from_name: "MFGB website enquiry",
      name: enquiry.name,
      email: enquiry.email,
      enquiryType: enquiry.label,
      message: enquiry.message
    };

    return fetch(CONTACT_DELIVERY.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    }).then((response) => {
      return response
        .json()
        .catch(() => ({}))
        .then((data) => {
          // Web3Forms answers with { success, message }; check both the HTTP
          // status and that flag, so a 200 carrying a rejection is still caught.
          if (!response.ok || data.success === false) {
            throw new Error(data.message || "Enquiry rejected with status " + response.status);
          }
          return data;
        });
    });
  }

  /* Where the visitor can send from when no endpoint is configured. A single
     mailto: link is not enough on its own: most people read mail in a browser
     with no mail app registered, where clicking it does nothing at all and the
     enquiry disappears without trace. Offering the three big webmail services
     costs one click and always produces a written message, and whoever has a
     mail app still gets the last option.

     Each href() takes the recipient, subject and body and returns a compose
     URL. `to` needs no encoding — it is our own address, not user input. */
  const COMPOSE_CHANNELS = [
    {
      label: "Gmail",
      href: (to, subject, body) =>
        "https://mail.google.com/mail/?view=cm&fs=1&to=" + to +
        "&su=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body)
    },
    {
      label: "Yahoo Mail",
      href: (to, subject, body) =>
        "https://compose.mail.yahoo.com/?to=" + to +
        "&subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body)
    },
    {
      label: "Outlook",
      href: (to, subject, body) =>
        "https://outlook.live.com/mail/0/deeplink/compose?to=" + to +
        "&subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body)
    },
    {
      label: "My mail app",
      href: (to, subject, body) =>
        "mailto:" + to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body)
    }
  ];

  function showSendOptions(enquiry) {
    const panel = document.getElementById("form-send");
    const options = document.getElementById("form-send-options");
    if (!panel || !options) return;

    options.textContent = "";

    COMPOSE_CHANNELS.forEach((channel) => {
      const link = document.createElement("a");
      link.className = "form-send-option";
      link.textContent = channel.label;
      link.href = channel.href(CONTACT_DELIVERY.email, enquiry.subject, enquiry.body);
      // A new tab, so the visitor does not lose what they wrote here.
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      options.appendChild(link);
    });

    panel.hidden = false;
  }

  function hideSendOptions() {
    const panel = document.getElementById("form-send");
    if (panel) panel.hidden = true;
  }

  function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorSlot = document.getElementById("error-" + fieldId);
    if (field) field.classList.toggle("has-error", Boolean(message));
    if (errorSlot) errorSlot.textContent = message;
    return !message;
  }

  function clearFormErrors() {
    form.querySelectorAll(".form-field input, .form-field select, .form-field textarea")
      .forEach((field) => field.classList.remove("has-error"));
    form.querySelectorAll(".form-error").forEach((slot) => (slot.textContent = ""));
  }

  function setFormStatus(message, isError) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.toggle("is-success", !isError);
    formStatus.classList.toggle("is-error", Boolean(isError));
  }

  function validateForm(formData) {
    let isValid = true;

    const name = formData.get("full-name").trim();
    isValid = setFieldError("full-name", name ? "" : "Please enter your full name.") && isValid;

    const email = formData.get("email").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      isValid = setFieldError("email", "Please enter your email address.") && isValid;
    } else if (!emailPattern.test(email)) {
      isValid = setFieldError("email", "Please enter a valid email address.") && isValid;
    } else {
      isValid = setFieldError("email", "") && isValid;
    }

    const subjectType = formData.get("subject-type");
    isValid = setFieldError("subject-type", subjectType ? "" : "Please choose a subject type.") && isValid;

    const message = formData.get("message").trim();
    isValid = setFieldError("message", message ? "" : "Please write a short message.") && isValid;

    return isValid;
  }

  function initFormHandler() {
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormErrors();
      setFormStatus("", false);
      hideSendOptions();

      const formData = new FormData(form);

      if (!validateForm(formData)) {
        setFormStatus("Please correct the highlighted fields and try again.", true);
        const firstInvalid = form.querySelector(".has-error");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const enquiry = composeEnquiry(formData);
      const submitButton = form.querySelector("button[type='submit']");

      if (!CONTACT_DELIVERY.endpoint) {
        /* Show the visitor where they can send from rather than launching the
           one we picked. Nothing is navigated to automatically: a mailto: link
           does nothing at all for anyone without a mail app registered, and
           their answers are left in the form so nothing is lost either way. */
        showSendOptions(enquiry);
        setFormStatus(
          "Your enquiry is ready — choose where to send it from below, " +
          "and it will open in a new tab with your message already written.",
          false
        );
        if (formStatus) formStatus.focus();
        return;
      }

      setFormStatus("Sending your enquiry…", false);
      if (submitButton) submitButton.disabled = true;

      /* Decoy field: only a bot ticks something it cannot see. Answer as though
         all is well and send nothing, so the bot gets no signal to retry. */
      const decoy = form.querySelector("[data-spam-trap]");
      if (decoy && decoy.checked) {
        setFormStatus(ENQUIRY_RECEIVED, false);
        form.reset();
        if (submitButton) submitButton.disabled = false;
        return;
      }

      sendViaEndpoint(enquiry)
        .then(() => {
          setFormStatus(ENQUIRY_RECEIVED, false);
          form.reset();
          hideSendOptions();
        })
        .catch(() => {
          /* The enquiry is not lost. Offer the compose links so the visitor can
             send it themselves, rather than being told to start again — and
             their answers are still in the form behind the panel. */
          showSendOptions(enquiry);
          setFormStatus(
            "Sorry — your enquiry could not be sent just now. You can still send " +
            "it yourself using the options below.",
            true
          );
        })
        .finally(() => {
          if (submitButton) submitButton.disabled = false;
          // Move focus to the status message so screen readers announce it.
          if (formStatus) formStatus.focus();
        });
    });
  }

  /* ============================================================
     05. Back-to-Top Observer
     ============================================================ */
  const backToTop = document.getElementById("back-to-top");

  function initBackToTop() {
    if (!backToTop) return;

    const toggleVisibility = () => {
      const show = window.scrollY > 400;
      backToTop.hidden = !show;
    };

    // Throttle scroll with requestAnimationFrame for smoothness.
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            toggleVisibility();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    toggleVisibility();
  }

  /* ============================================================
     06. Canopy Door Toggle (glassmorphism exhibit card)
     ============================================================ */
  function initCanopyToggle() {
    const card = document.getElementById("canopy-card");
    if (!card) return;
    const lid = card.querySelector(".canopy-lid");
    if (!lid) return;

    const setOpen = (open) => {
      card.classList.toggle("is-open", open);
      lid.setAttribute("aria-pressed", String(open));
    };

    // Tap / keyboard activation toggles the canopy (hover handled in CSS).
    lid.addEventListener("click", () => {
      setOpen(!card.classList.contains("is-open"));
    });
  }

  /* ============================================================
     08. Ignition Key Theme Toggle (Night Drive Dark)
     ============================================================ */
  function initThemeToggle() {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    const root = document.documentElement;

    const applyTheme = (dark) => {
      root.setAttribute("data-theme", dark ? "dark" : "light");
      toggle.setAttribute("aria-checked", String(dark));
      try {
        localStorage.setItem("mfgb-theme", dark ? "dark" : "light");
      } catch (err) {
        /* storage unavailable — ignore */
      }
    };

    let saved = null;
    try {
      saved = localStorage.getItem("mfgb-theme");
    } catch (err) {
      /* ignore */
    }
    // Dark mode is the site default; only an explicit "light" choice overrides it.
    applyTheme(saved !== "light");

    toggle.addEventListener("click", () => {
      applyTheme(root.getAttribute("data-theme") !== "dark");
    });
  }

  /* ============================================================
     08b. Header Scroll Compress
     (Shrinks the pinned tab navigation once the page is scrolled
     so it always stays visible without taking up extra room.)
     ============================================================ */
  function initHeaderCompress() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ============================================================
     10. Featured Exhibit — promote any exhibit box
     ------------------------------------------------------------
     Pressing one of the smaller exhibit boxes promotes it into the
     featured slot: that card grows to full width and brings its own
     image, description and specification sheet with it, while the
     card that held the slot drops into the gap. Pressing that card
     promotes it straight back.

     The featured position is driven by the .exhibit-featured class
     plus `order` — re-ordering rather than moving nodes, because
     moving a node that holds focus drops focus. The specification
     panel is the one thing re-parented, into whichever card is
     featured.

     Each sheet is one source of truth: the ME 200 sheet is authored
     inline in the page (so the specification still reads without
     JavaScript) and doubles as the default, and the other cars come
     from inert <template>s.
     ============================================================ */
  function initExhibitSpecPanel() {
    const panel = document.querySelector("[data-spec-panel]");
    if (!panel) return;

    const body = panel.querySelector("[data-spec-body]");
    const carLabel = panel.querySelector("[data-spec-car]");
    const status = panel.querySelector("[data-spec-status]");
    const triggers = Array.prototype.slice.call(
      document.querySelectorAll("[data-spec-select]")
    );
    if (!body || !carLabel || triggers.length === 0) return;

    const entries = [];
    triggers.forEach((trigger) => {
      const card = trigger.closest(".exhibit-card");
      if (!card) return;
      entries.push({
        key: trigger.getAttribute("data-spec-select"),
        trigger: trigger,
        card: card,
        photo: trigger.closest(".media-placeholder"),
        body: card.querySelector(".exhibit-body")
      });
    });
    if (entries.length === 0) return;

    const entryFor = (key) => entries.filter((entry) => entry.key === key)[0];
    const prefersReducedMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The inline sheet belongs to the car named on the panel itself.
    const sheets = {};
    sheets[panel.getAttribute("data-spec-panel")] = body.innerHTML;

    let featuredKey = panel.getAttribute("data-spec-panel");
    let swapTimer = null;
    let flashTimer = null;

    function markFeatured(key) {
      entries.forEach((entry) => {
        const isFeatured = entry.key === key;
        entry.card.classList.toggle("exhibit-featured", isFeatured);
        entry.trigger.setAttribute("aria-pressed", String(isFeatured));
        if (entry.photo) entry.photo.classList.toggle("is-selected", isFeatured);

        // "Featured Exhibit" belongs to the slot, not the car — a demoted
        // card falls back to its own tag from data-tag.
        const tag = entry.card.querySelector(".exhibit-tag");
        if (tag) {
          tag.textContent = isFeatured
            ? "Featured Exhibit"
            : tag.getAttribute("data-tag") || tag.textContent;
        }
      });
    }

    function replay(card, className) {
      card.classList.remove(className);
      void card.offsetWidth; // restart the animation
      card.classList.add(className);
      window.setTimeout(() => card.classList.remove(className), 440);
    }

    // Bring the grown card into view when it is off-screen — on a phone a
    // press would otherwise look like nothing happened.
    function revealCard(card, immediate) {
      const box = card.getBoundingClientRect();
      const visible = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);
      const wanted = Math.min(box.height, window.innerHeight * 0.75);
      if (visible > wanted * 0.6) return;
      card.scrollIntoView({
        behavior: immediate || prefersReducedMotion() ? "auto" : "smooth",
        block: "start"
      });
    }

    function promote(key, immediate) {
      if (key === featuredKey) return;

      const entry = entryFor(key);
      const previous = entryFor(featuredKey);
      if (!entry || !entry.body) return;

      if (!(key in sheets)) {
        const template = document.getElementById("spec-" + key);
        if (!template) return;
        sheets[key] = template.innerHTML;
      }

      featuredKey = key;
      markFeatured(key);
      entry.body.appendChild(panel); // the sheet travels with its card

      // Keep the address bar pointing at the car on show, so reloading or
      // copying the link lands on the same exhibit. replaceState adds no
      // history entry and fires no hashchange, so nothing loops.
      try {
        window.history.replaceState(null, "", "#exhibit-" + key);
      } catch (err) {
        /* history unavailable — the page still works, just without the hash */
      }

      carLabel.textContent = entry.trigger.getAttribute("data-spec-name") || "";
      if (status) {
        const full =
          entry.trigger.getAttribute("data-spec-full") ||
          entry.trigger.getAttribute("data-spec-name") ||
          "";
        status.textContent = full + " is now the featured exhibit.";
      }

      // Sheet out, swap, in — plus a brass flash on the frame. A deep link
      // swaps straight away so the page never arrives half-drawn.
      window.clearTimeout(swapTimer);
      window.clearTimeout(flashTimer);
      body.classList.remove("is-in", "is-out");

      if (immediate) {
        body.innerHTML = sheets[key];
      } else {
        body.classList.add("is-out");
        panel.classList.add("is-swapping");
        flashTimer = window.setTimeout(() => panel.classList.remove("is-swapping"), 700);

        swapTimer = window.setTimeout(() => {
          body.innerHTML = sheets[key];
          body.classList.remove("is-out");
          body.classList.add("is-in");
          window.setTimeout(() => body.classList.remove("is-in"), 260);
        }, 150);
      }

      if (!immediate && !prefersReducedMotion()) {
        replay(entry.card, "is-promoting");
        if (previous && previous !== entry) replay(previous.card, "is-demoting");
      }

      revealCard(entry.card, immediate);
    }

    entries.forEach((entry) => {
      // Only offer the photo selector once it actually does something.
      entry.trigger.removeAttribute("hidden");
      entry.trigger.addEventListener("click", () => promote(entry.key));

      // The whole small box is pressable; links and the info icon inside
      // a card keep their own behaviour.
      entry.card.addEventListener("click", (event) => {
        if (event.target.closest("a, button:not(.exhibit-select)")) return;
        promote(entry.key);
      });
    });

    // Mark the card that already holds the featured slot.
    markFeatured(featuredKey);

    // Deep link — the home page widgets arrive as
    // exhibits.html#exhibit-kr175, which opens with that car promoted.
    function keyFromHash() {
      const match = /^#exhibit-(.+)$/.exec(window.location.hash || "");
      return match && entryFor(match[1]) ? match[1] : null;
    }

    const linked = keyFromHash();
    if (linked && linked !== featuredKey) promote(linked, true);

    window.addEventListener("hashchange", () => {
      const key = keyFromHash();
      if (key) promote(key);
    });
  }

  /* ============================================================
     09. Home Hero Photograph Deck
     ------------------------------------------------------------
     The three photographs in the home hero sit in a shuffled stack:
     the one on show is full size and the two behind peek out up and to
     the right. Every few seconds the stack is dealt one place forward,
     which slides the plate at the back up to the front and steps the
     old front back behind it. styles.css section 07d owns the geometry
     and the animation curve; this module only decides which plate is
     where.

     The stack is held still for a reader who has asked for reduced
     motion, while the pointer is resting on it, and while the tab is in
     the background. A photograph is not worth animating at someone who
     has asked the machine to calm down.
     ============================================================ */
  function initHeroDeck() {
    const deck = document.getElementById("hero-deck");
    if (!deck) return;

    const slides = Array.prototype.slice.call(
      deck.querySelectorAll(".hero-deck-slide")
    );
    if (slides.length < 2) return;

    // Captions name a plate by its index in the deck and are only shown
    // while that plate is the one on show.
    const captions = Array.prototype.slice.call(
      deck.querySelectorAll(".hero-deck-caption")
    );

    // How long a photograph holds the front. Keep it in step with the
    // transform transition in styles.css section 07d.
    const HOLD = 6000;

    const reduceMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let front = 0; // index of the photograph currently on show
    let held = false; // pointer resting on the deck
    let timer = null;

    // The fan has room for the plate on show and two behind it. Anything
    // deeper shares the back slot and is faded out, so a deck of four or
    // five photographs still reads as a stack of three.
    const FAN = 3;

    // Depth counts backwards from the plate on show, so one turn of the
    // stack takes every plate exactly one place nearer the front.
    function paint() {
      slides.forEach((slide, index) => {
        const depth = (index - front + slides.length) % slides.length;
        slide.setAttribute("data-depth", String(Math.min(depth, FAN - 1)));
        slide.classList.toggle("is-buried", depth >= FAN);
      });

      captions.forEach((caption) => {
        const owner = Number(caption.getAttribute("data-caption-for"));
        caption.classList.toggle("is-shown", owner === front);
      });
    }

    // direction +1 brings the next plate forward, -1 pushes the stack back.
    function step(direction) {
      front = (front - direction + slides.length) % slides.length;
      paint();
      // A manual move earns a full hold before the rotation resumes, so the
      // deck never steps out from under the reader's finger.
      run();
    }

    function run() {
      window.clearInterval(timer);
      timer = null;
      if (held || document.hidden || reduceMotion()) return;
      timer = window.setInterval(() => step(1), HOLD);
    }

    function hold(value) {
      held = value;
      run();
    }

    deck.addEventListener("pointerenter", () => hold(true));
    deck.addEventListener("pointerleave", () => hold(false));
    document.addEventListener("visibilitychange", run);

    // A reader who changes the preference mid-visit should not have to
    // reload the page for it to take effect.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", run);
    }

    // ---- Manual control -------------------------------------------------
    // Buttons for a pointer or a keyboard, a swipe for a thumb. Both move
    // the stack the same way the rotation does, and both restart the hold
    // so a deliberate move is not immediately undone.
    Array.prototype.slice
      .call(deck.querySelectorAll("[data-deck-step]"))
      .forEach((button) => {
        button.addEventListener("click", () => {
          step(Number(button.getAttribute("data-deck-step")) || 1);
        });
      });

    const frame = deck.querySelector(".hero-deck-frame");
    const SWIPE = 40; // px of travel before a drag counts as a swipe

    if (frame) {
      let fromX = 0;
      let fromY = 0;
      let tracking = false;

      frame.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        tracking = true;
        fromX = event.clientX;
        fromY = event.clientY;
      });

      frame.addEventListener("pointerup", (event) => {
        if (!tracking) return;
        tracking = false;

        const dx = event.clientX - fromX;
        const dy = event.clientY - fromY;
        // Horizontal intent only. A diagonal drag is far more likely to be
        // someone scrolling the page, and must not be swallowed.
        if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy)) return;
        step(dx < 0 ? 1 : -1);
      });

      frame.addEventListener("pointercancel", () => {
        tracking = false;
      });
    }

    paint();
    run();
  }

  /* ============================================================
     10. Initialisation
     ============================================================ */
  function init() {
    initNavToggle();
    initActiveNav();
    initHistorySpotlight();
    initHistoryScrollSlowdown();
    initFormHandler();
    initBackToTop();
    initCanopyToggle();
    initThemeToggle();
    initHeaderCompress();
    initExhibitSpecPanel();
    initHeroDeck();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
