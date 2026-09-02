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
   09. Initialisation
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     01. Navigation Drawer Toggle
     ============================================================ */
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");

  function setNavState(isOpen) {
    navToggle.setAttribute("aria-expanded", String(isOpen));
    mainNav.setAttribute("aria-hidden", String(!isOpen));
    mainNav.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Toggle navigation");
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

    // Close on Escape and return focus to the toggle for keyboard users.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setNavState(false);
        navToggle.focus();
      }
    });

    // Reset the drawer state when resizing to a desktop layout.
    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
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

      const formData = new FormData(form);

      if (!validateForm(formData)) {
        setFormStatus("Please correct the highlighted fields and try again.", true);
        const firstInvalid = form.querySelector(".has-error");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // No backend is wired up yet: simulate a successful send.
      setFormStatus("Thank you — your enquiry has been received. We will reply within 5 working days.", false);
      form.reset();

      // Move focus to the status message so screen readers announce it.
      if (formStatus) formStatus.focus();
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
     09. KR200 controls — choke + ignition-switch launch
     ------------------------------------------------------------
     The floating dashboard mimics a real KR200 dash: pull the choke
     (far left) and then turn the ignition switch to fire up the retro
     KR200 Racer built in module 08b. The red button (handled by
     initThemeToggle) switches between light and dark mode.
     ============================================================ */
  function initEngineToggle(game) {
    const choke = document.getElementById("choke-control");
    const sw = document.getElementById("turn-switch");
    if (!choke || !sw) return;

    let chokeOn = false;
    let fired = false;

    const resetControls = function () {
      chokeOn = false;
      fired = false;
      choke.classList.remove("is-pulled");
      choke.setAttribute("aria-pressed", "false");
      sw.classList.remove("is-turned");
      sw.setAttribute("aria-checked", "false");
    };

    choke.addEventListener("click", () => {
      chokeOn = !chokeOn;
      choke.classList.toggle("is-pulled", chokeOn);
      choke.setAttribute("aria-pressed", String(chokeOn));
      if (!chokeOn) fired = false;
    });

    sw.addEventListener("click", () => {
      const turningOn = sw.getAttribute("aria-checked") !== "true";
      sw.classList.toggle("is-turned", turningOn);
      sw.setAttribute("aria-checked", String(turningOn));
      // choke pulled + key turned = fire up the KR200 Racer
      if (turningOn && chokeOn && !fired) {
        fired = true;
        if (game) game.open();
        resetControls();
      }
    });
  }

    /* ============================================================
       09b. Retro KR200 Racer — arcade time-trial
       ------------------------------------------------------------
       A self-contained retro driving game launched from the START
       button. Pick a circuit on the title screen:
         • TEST CIRCUIT — compact oval, whole track on screen
         • HOCKENHEIMRING — endurance test around the Hockenheimring,
           historic stadium section (right) thick with trees and
           debris raining onto the road to dodge for a big score.
       Lap/total timers, MPH readout, off-road slowdown, arcade
       controls, WebAudio engine hum + retro SFX, and a CRT overlay.
       The overlay is injected here so it works on every page.
       ============================================================ */
  function initKr200Game() {
    const CANVAS_W = 960;
    const CANVAS_H = 600;
    const MAX_REV = -130;
    const ACCEL = 300;
    const BRAKE = 420;
    const REV_ACCEL = 220;
    const STEER = 2.7;

    /* ---------- Track definitions ---------- */
    // Nürburgring points: flat [x0,y0,x1,y1,...] in world units (road half-width 46),
    // centred on the origin, traced from the Foundation's official layout map.
    const RING_PTS = [-760,-1046,-754,-1044,-746,-1040,-734,-1036,-718,-1030,-702,-1024,-682,-1018,-662,-1012,-642,-1006,-620,-1002,-596,-998,-574,-994,-550,-992,-528,-990,-504,-988,-482,-986,-460,-984,-436,-982,-414,-978,-392,-976,-370,-974,-346,-970,-324,-968,-302,-964,-280,-962,-258,-960,-234,-960,-212,-960,-190,-960,-168,-960,-144,-962,-122,-964,-102,-966,-80,-968,-60,-968,-42,-968,-24,-966,-8,-962,8,-956,20,-948,34,-938,46,-926,56,-914,68,-900,80,-886,94,-872,108,-858,124,-846,140,-834,158,-824,178,-814,198,-804,218,-796,240,-786,260,-778,282,-770,304,-762,324,-754,346,-748,368,-742,388,-736,410,-734,430,-732,450,-732,470,-732,488,-734,506,-738,522,-740,536,-742,546,-744,556,-744,564,-742,570,-738,574,-732,576,-724,578,-716,578,-708,580,-698,584,-690,588,-684,594,-678,602,-676,612,-674,626,-676,640,-680,656,-688,672,-696,690,-704,706,-714,724,-724,742,-734,760,-742,776,-748,792,-752,808,-754,824,-754,838,-750,852,-744,864,-736,878,-724,888,-710,900,-696,910,-680,918,-664,928,-648,936,-634,946,-620,956,-610,964,-600,974,-596,984,-594,992,-596,1000,-600,1008,-606,1014,-616,1018,-628,1022,-640,1024,-652,1028,-666,1030,-678,1032,-690,1036,-702,1040,-714,1048,-724,1054,-734,1062,-742,1072,-750,1080,-756,1088,-760,1094,-764,1098,-764,1102,-762,1102,-758,1100,-750,1098,-740,1092,-728,1086,-714,1078,-700,1070,-682,1062,-664,1054,-646,1044,-628,1036,-608,1026,-590,1018,-572,1010,-556,1000,-540,992,-524,984,-512,976,-500,966,-488,958,-478,952,-470,946,-462,942,-454,940,-448,940,-440,942,-432,948,-424,954,-418,964,-410,974,-404,984,-398,994,-392,1004,-388,1010,-384,1014,-380,1016,-378,1014,-376,1008,-374,1000,-374,990,-374,978,-374,962,-374,948,-374,930,-374,914,-372,900,-370,886,-366,872,-362,862,-358,852,-352,844,-344,838,-336,832,-328,828,-318,824,-308,818,-298,814,-286,808,-274,802,-262,796,-248,790,-236,786,-222,782,-210,782,-200,784,-190,786,-182,792,-176,802,-172,812,-170,822,-170,834,-172,844,-174,854,-176,864,-178,870,-182,874,-182,874,-182,872,-182,868,-180,860,-176,848,-172,836,-166,820,-160,804,-152,786,-146,768,-138,748,-130,728,-122,708,-114,688,-106,668,-98,646,-88,626,-80,606,-72,586,-64,566,-56,546,-48,530,-42,514,-34,500,-26,490,-20,482,-12,476,-6,476,2,476,8,480,14,484,18,488,22,492,26,494,28,494,30,492,30,486,30,476,30,464,28,448,28,432,28,414,28,394,30,376,32,356,36,336,42,316,48,296,56,276,64,258,74,238,86,220,98,204,110,188,122,174,134,160,148,148,160,138,170,128,180,118,190,108,198,98,206,88,212,76,220,64,226,50,232,36,238,20,246,6,254,-10,264,-26,274,-42,286,-56,298,-72,312,-84,326,-98,340,-110,354,-122,368,-134,382,-146,396,-158,410,-168,424,-180,438,-192,452,-202,466,-214,478,-226,492,-238,506,-250,520,-260,534,-270,548,-278,562,-284,578,-288,590,-290,604,-288,616,-284,628,-276,638,-266,648,-252,656,-236,664,-218,670,-198,674,-178,678,-156,680,-134,684,-110,684,-88,686,-64,686,-42,686,-20,686,2,686,22,686,40,686,58,686,70,686,82,686,88,686,92,686,90,686,84,686,76,686,62,686,48,686,30,686,10,686,-12,686,-34,686,-56,686,-78,686,-102,686,-124,684,-148,684,-170,682,-190,682,-210,682,-230,682,-246,682,-260,686,-270,690,-278,694,-280,700,-280,708,-276,718,-270,728,-260,738,-248,748,-234,760,-218,770,-204,782,-190,792,-178,802,-166,810,-158,818,-150,822,-148,824,-148,824,-150,824,-156,820,-164,814,-174,806,-188,796,-202,788,-216,776,-234,766,-250,756,-268,746,-284,736,-300,726,-316,718,-330,710,-344,702,-358,694,-368,686,-380,680,-388,672,-398,666,-406,658,-414,652,-424,646,-434,642,-444,638,-454,634,-464,634,-474,634,-484,638,-494,642,-502,646,-510,650,-516,656,-524,660,-530,664,-538,666,-546,668,-556,670,-568,672,-580,672,-594,676,-610,680,-626,686,-640,694,-656,704,-670,716,-682,730,-692,744,-702,762,-710,778,-716,796,-720,814,-724,832,-728,850,-732,868,-738,884,-744,900,-752,914,-762,928,-772,942,-786,954,-800,966,-814,978,-830,990,-844,1002,-858,1012,-872,1020,-884,1028,-898,1034,-910,1038,-922,1042,-934,1044,-948,1044,-962,1046,-976,1046,-992,1046,-1006,1046,-1022,1046,-1034,1046,-1046,1046,-1054,1048,-1058,1048,-1060,1048,-1060,1046,-1054,1044,-1048,1042,-1038,1038,-1026,1032,-1014,1028,-1002,1022,-992,1014,-980,1008,-970,1000,-958,994,-948,986,-938,978,-928,968,-916,958,-906,948,-894,936,-882,924,-870,910,-858,894,-846,876,-834,858,-824,840,-816,820,-808,800,-800,780,-794,760,-790,740,-788,720,-786,700,-786,682,-790,662,-792,646,-798,630,-804,618,-812,606,-820,598,-828,592,-836,590,-844,590,-850,594,-856,600,-860,608,-862,618,-862,628,-862,642,-862,654,-860,668,-860,680,-862,694,-864,708,-866,720,-872,734,-878,746,-886,760,-894,772,-902,784,-910,796,-918,808,-926,820,-934,832,-940,842,-946,852,-950,860,-956,868,-960,874,-966,880,-972,886,-978,890,-986,892,-994,894,-1004,896,-1014,896,-1026,896,-1038,894,-1052,892,-1064,890,-1076,888,-1086,884,-1094,880,-1100,876,-1102,872,-1100,868,-1096,866,-1090,862,-1078,860,-1066,858,-1052,854,-1036,852,-1020,848,-1004,842,-990,836,-974,830,-960,822,-946,812,-932,802,-920,790,-910,778,-900,766,-892,752,-884,740,-880,726,-876,714,-874,704,-876,694,-878,684,-880,676,-886,668,-890,662,-894,656,-898,652,-900,646,-902,640,-902,632,-900,626,-900,616,-898,606,-898,594,-898,582,-900,568,-904,554,-908,540,-916,526,-926,510,-936,496,-948,482,-962,466,-978,452,-992,438,-1008,424,-1024,410,-1038,398,-1054,384,-1066,372,-1078,362,-1088,354,-1094,346,-1098,342,-1100,340,-1100,342,-1094,346,-1088,352,-1078,360,-1068,368,-1054,380,-1038,390,-1022,402,-1006,412,-988,422,-970,430,-950,438,-932,442,-912,446,-894,446,-876,444,-858,440,-840,434,-824,426,-810,418,-794,406,-782,394,-768,380,-756,366,-744,352,-734,338,-726,324,-718,310,-712,296,-708,282,-708,268,-710,254,-714,240,-720,224,-730,210,-740,194,-750,176,-762,160,-772,142,-782,124,-790,104,-798,86,-804,66,-808,46,-812,26,-814,8,-814,-12,-816,-32,-816,-50,-816,-70,-816,-90,-818,-108,-818,-128,-820,-150,-824,-170,-826,-190,-830,-210,-832,-230,-834,-252,-834,-270,-832,-290,-828,-308,-824,-326,-816,-344,-806,-360,-794,-376,-780,-392,-766,-406,-750,-422,-734,-436,-718,-452,-702,-468,-688,-484,-672,-500,-656,-516,-642,-534,-626,-552,-612,-568,-596,-586,-582,-602,-566,-620,-552,-636,-540,-654,-528,-670,-518,-686,-510,-704,-504,-720,-500,-736,-498,-752,-496,-768,-494,-784,-492,-798,-488,-812,-484,-826,-478,-838,-470,-850,-460,-862,-450,-872,-436,-880,-422,-888,-410,-894,-396,-900,-384,-904,-372,-910,-364,-916,-358,-920,-356,-926,-356,-934,-360,-940,-366,-948,-376,-954,-390,-962,-406,-968,-422,-974,-442,-978,-462,-982,-484,-984,-506,-986,-530,-988,-552,-992,-576,-994,-598,-998,-620,-1002,-642,-1006,-664,-1012,-684,-1018,-704,-1024,-720,-1030,-734,-1036,-746,-1040,-756,-1044,-760,-1046,-762,-1048];

    // ---------- Hockenheimring ----------
    // Built as a smooth closed loop from a small set of control points.
    // The historic Motodrom stadium section (the hairpin) sits on the
    // right side of the circuit and carries extra trees (see treeCluster).
    function closedLoopPoints(ctrl, perSeg) {
      const out = [];
      const n = ctrl.length;
      for (let i = 0; i < n; i++) {
        const p0 = ctrl[(i - 1 + n) % n];
        const p1 = ctrl[i];
        const p2 = ctrl[(i + 1) % n];
        const p3 = ctrl[(i + 2) % n];
        for (let j = 0; j < perSeg; j++) {
          const t = j / perSeg;
          const t2 = t * t;
          const t3 = t2 * t;
          const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
          const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
          out.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
        }
      }
      return out;
    }
    const HOCK_CTRL = [
      { x: -700, y: -700 }, { x: -300, y: -700 }, { x: 100, y: -700 }, { x: 500, y: -700 }, { x: 760, y: -650 },
      { x: 980, y: -540 }, { x: 1130, y: -380 }, { x: 1210, y: -180 }, { x: 1180, y: 20 },
      { x: 1040, y: 140 }, { x: 900, y: 120 }, { x: 820, y: -20 }, { x: 860, y: -160 },
      { x: 1000, y: -240 }, { x: 1140, y: -180 }, { x: 1160, y: -20 },
      { x: 1080, y: 180 }, { x: 920, y: 320 }, { x: 700, y: 380 },
      { x: 300, y: 400 }, { x: -100, y: 400 }, { x: -500, y: 380 }, { x: -720, y: 300 },
      { x: -880, y: 140 }, { x: -940, y: -80 }, { x: -900, y: -320 }, { x: -800, y: -540 }
    ];
    const HOCKENHEIM_PTS = closedLoopPoints(HOCK_CTRL, 12);

    const TRACKS = {
      test: {
        name: "TEST CIRCUIT",
        laps: 3,
        roadHalf: 70,
        maxSpeed: 345,
        zoom: 1,
        follow: false,
        camX: CANVAS_W / 2,
        camY: CANVAS_H / 2,
        look: 0,
        oval: true,
        treeCount: 26
      },
      ring: {
        name: "HOCKENHEIMRING",
        laps: 2,
        roadHalf: 52,
        maxSpeed: 480,
        zoom: 0.95,
        follow: true,
        camX: 0,
        camY: 0,
        look: 130,
        oval: false,
        pts: HOCKENHEIM_PTS,
        treeCount: 80,
        // historic Motodrom stadium section (right side) — extra trees
        treeCluster: { x0: 760, x1: 1260, y0: -420, y1: 220, count: 46 }
      }
    };
    let selectedTrack = "test";
    let track = null;
    let camera = { x: 0, y: 0 };

    /* ---------- Build the overlay DOM once ---------- */
    let overlay = document.getElementById("kr200-game");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "kr200-game";
      overlay.className = "kr200-game";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "KR200 Retro Racing Game");
      overlay.innerHTML =
        '<div class="game-stage">' +
        '  <canvas class="game-canvas" id="game-canvas" width="' + CANVAS_W + '" height="' + CANVAS_H + '" aria-label="KR200 racing circuit"></canvas>' +
        '  <div class="game-crt" aria-hidden="true"></div>' +
        '  <div class="game-hud" id="game-hud" hidden>' +
        '    <span class="hud-lap">LAP <span id="hud-lap">1</span>/<span id="hud-laps">3</span></span>' +
        '    <span class="hud-time" id="hud-time">0:00.00</span>' +
        '    <span class="hud-best">BEST <span id="hud-best">--:--.--</span></span>' +
        '    <span class="hud-score">SCORE <span id="hud-score">0</span></span>' +
        '    <span class="hud-speed"><span id="hud-speed">0</span> MPH</span>' +
        '    <span class="hud-controls">\u2191 ACCEL \u00b7 \u2193 BRAKE \u00b7 \u2190\u2192 STEER \u00b7 ESC PAUSE</span>' +
        '  </div>' +
        '  <div class="game-actions">' +
        '    <button class="game-mute" id="game-mute" type="button">SOUND: ON</button>' +
        '    <button class="game-close" id="game-close" type="button" aria-label="Exit game">EXIT</button>' +
        '  </div>' +
        '  <div class="game-touch" id="game-touch" aria-hidden="true">' +
        '    <button data-k="left" type="button">\u2190</button>' +
        '    <button data-k="up" type="button">\u2191</button>' +
        '    <button data-k="down" type="button">\u2193</button>' +
        '    <button data-k="right" type="button">\u2192</button>' +
        '  </div>' +
        '  <div class="game-screen" id="screen-title">' +
        '    <p class="game-eyebrow">MESSERSCHMITT FOUNDATION OF GREAT BRITAIN</p>' +
        '    <h2 class="game-title">KR200 RACER</h2>' +
        '    <p class="game-tagline" id="game-tagline"></p>' +
        '    <div class="game-track-select" role="group" aria-label="Choose track">' +
        '      <button class="game-track-btn" data-track="test" type="button">TEST CIRCUIT</button>' +
        '      <button class="game-track-btn" data-track="ring" type="button">HOCKENHEIMRING</button>' +
        '    </div>' +
        '    <button class="game-btn" id="btn-start-race" type="button">\u25b6 START ENGINE</button>' +
        '    <p class="game-hint">ENTER to race \u00b7 ESC to exit</p>' +
        '  </div>' +
        '  <div class="game-screen" id="screen-paused" hidden>' +
        '    <h2 class="game-title">PAUSED</h2>' +
        '    <p class="game-hint">Press ESC to resume</p>' +
        '  </div>' +
        '  <div class="game-screen" id="screen-finish" hidden>' +
        '    <p class="game-eyebrow">RACE COMPLETE</p>' +
        '    <h2 class="game-title">FINISH!</h2>' +
        '    <dl class="game-results">' +
        '      <div><dt>TOTAL TIME</dt><dd id="res-time">0:00.00</dd></div>' +
        '      <div><dt>BEST LAP</dt><dd id="res-best">--:--.--</dd></div>' +
        '      <div><dt>LAPS</dt><dd id="res-laps">2</dd></div>' +
        '      <div><dt>SCORE</dt><dd id="res-score">0</dd></div>' +
        '    </dl>' +
        '    <div class="game-results-actions">' +
        '      <button class="game-btn" id="btn-again" type="button">\u21bb RACE AGAIN</button>' +
        '      <button class="game-btn game-btn-ghost" id="btn-exit" type="button">EXIT</button>' +
        '    </div>' +
        '  </div>' +
        '</div>';
      document.body.appendChild(overlay);
    }

    const canvas = overlay.querySelector("#game-canvas");
    const ctx = canvas.getContext("2d");
    const hud = overlay.querySelector("#game-hud");
    const elLap = overlay.querySelector("#hud-lap");
    const elLaps = overlay.querySelector("#hud-laps");
    const elTime = overlay.querySelector("#hud-time");
    const elBest = overlay.querySelector("#hud-best");
    const elSpeed = overlay.querySelector("#hud-speed");
    const elScore = overlay.querySelector("#hud-score");
    const screens = {
      title: overlay.querySelector("#screen-title"),
      paused: overlay.querySelector("#screen-paused"),
      finish: overlay.querySelector("#screen-finish")
    };

    /* ---------- Track geometry building ---------- */
    function nearestRaw(pts, x, y) {
      let best = Infinity;
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % n];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const len2 = dx * dx + dy * dy || 1;
        let t = ((x - p.x) * dx + (y - p.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = p.x + t * dx;
        const py = p.y + t * dy;
        const ddx = x - px;
        const ddy = y - py;
        best = Math.min(best, ddx * ddx + ddy * ddy);
      }
      return Math.sqrt(best);
    }

    function buildTrack(key) {
      const def = TRACKS[key];
      let pts;
      if (def.oval) {
        const n = 160;
        pts = [];
        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2 - Math.PI / 2;
          pts.push({ x: def.camX + 330 * Math.cos(t), y: def.camY + 205 * Math.sin(t) });
        }
      } else {
        const arr = def.pts;
        pts = [];
        for (let i = 0; i < arr.length; i += 2) pts.push({ x: arr[i], y: arr[i + 1] });
      }

      const n = pts.length;
      const normals = [];
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i + n - 1) % n];
        const p2 = pts[(i + 1) % n];
        const dx = p2.x - p0.x;
        const dy = p2.y - p0.y;
        const len = Math.hypot(dx, dy) || 1;
        normals.push({ x: -dy / len, y: dx / len });
      }
      const offsetPolyline = function (d) {
        const out = [];
        for (let i = 0; i < n; i++) out.push({ x: pts[i].x + normals[i].x * d, y: pts[i].y + normals[i].y * d });
        return out;
      };

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      // scatter trees off the road
      const trees = [];
      let tries = 0;
      while (trees.length < def.treeCount && tries < 4000) {
        tries++;
        const x = minX + (maxX - minX) * Math.random();
        const y = minY + (maxY - minY) * Math.random();
        if (nearestRaw(pts, x, y) > def.roadHalf + 34) {
          trees.push({ x: x, y: y, r: 6 + Math.random() * 5 });
        }
      }

      // extra trees packed into a dedicated region (e.g. the historic
      // stadium section on the right of the Hockenheimring)
      if (def.treeCluster) {
        const cl = def.treeCluster;
        let ct = 0, ctries = 0;
        while (ct < cl.count && ctries < 3000) {
          ctries++;
          const x = cl.x0 + (cl.x1 - cl.x0) * Math.random();
          const y = cl.y0 + (cl.y1 - cl.y0) * Math.random();
          if (nearestRaw(pts, x, y) > def.roadHalf + 30) {
            trees.push({ x: x, y: y, r: 7 + Math.random() * 6 });
            ct++;
          }
        }
      }

      track = {
        key: key,
        name: def.name,
        laps: def.laps,
        roadHalf: def.roadHalf,
        maxSpeed: def.maxSpeed,
        zoom: def.zoom,
        follow: def.follow,
        camX: def.camX,
        camY: def.camY,
        look: def.look,
        pts: pts,
        normals: normals,
        edgeOuter: offsetPolyline(def.roadHalf - 6),
        edgeInner: offsetPolyline(-(def.roadHalf - 6)),
        n: n,
        minX: minX, maxX: maxX, minY: minY, maxY: maxY,
        trees: trees,
        obstacles: [],
        startIndex: 0
      };
      camera.x = def.camX;
      camera.y = def.camY;
    }

    function nearestTrack(x, y) {
      let best = Infinity;
      let bestI = 0;
      const pts = track.pts;
      const n = track.n;
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % n];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const len2 = dx * dx + dy * dy || 1;
        let t = ((x - p.x) * dx + (y - p.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = p.x + t * dx;
        const py = p.y + t * dy;
        const ddx = x - px;
        const ddy = y - py;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < best) {
          best = d2;
          bestI = i;
        }
      }
      return { dist: Math.sqrt(best), seg: bestI };
    }

    /* ---------- Race state ---------- */
    let state = "idle"; // idle | race | paused | finished
    let car = null;
    let prevSeg = 0;
    let lapProgress = 0;
    let completedLaps = 0;
    let raceTime = 0;
    let lapStartTime = 0;
    let bestLap = Infinity;
    let lastT = 0;
    let lastFocused = null;
    let score = 0;
    let obstacleTimer = 0;
    const keys = { up: false, down: false, left: false, right: false };

    // Auto-pause if the tab is hidden so the sim never runs in slow-motion.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && state === "race") pauseGame();
    });

    /* ---------- Audio (WebAudio, retro beeps) ---------- */
    let audioCtx = null;
    let engineOsc = null;
    let engineGain = null;
    let engineFilter = null;
    let muted = false;

    function ensureAudio() {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function beep(freq, dur, type, vol, when) {
      if (!audioCtx || muted) return;
      const t0 = audioCtx.currentTime + (when || 0);
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    function startEngineSound() {
      ensureAudio();
      if (!audioCtx || muted) return;
      if (!engineOsc) {
        engineOsc = audioCtx.createOscillator();
        engineOsc.type = "sawtooth";
        engineFilter = audioCtx.createBiquadFilter();
        engineFilter.type = "lowpass";
        engineFilter.frequency.value = 380;
        engineGain = audioCtx.createGain();
        engineGain.gain.value = 0;
        engineOsc.connect(engineFilter);
        engineFilter.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        engineOsc.start();
      }
      engineGain.gain.setTargetAtTime(0.05, audioCtx.currentTime, 0.08);
    }

    function updateEngineSound() {
      if (!engineOsc || !engineFilter || !audioCtx || !car) return;
      const sp = Math.abs(car.speed);
      engineOsc.frequency.setTargetAtTime(52 + sp * 0.22, audioCtx.currentTime, 0.05);
      engineFilter.frequency.setTargetAtTime(300 + sp * 1.4, audioCtx.currentTime, 0.05);
    }

    function stopEngineSound() {
      if (engineGain && audioCtx) engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.06);
    }

    function setMuted(m) {
      muted = m;
      const btn = overlay.querySelector("#game-mute");
      if (btn) btn.textContent = muted ? "SOUND: OFF" : "SOUND: ON";
      if (muted) {
        stopEngineSound();
      } else if (state === "race") {
        startEngineSound();
      }
    }

    /* ---------- HUD / formatting ---------- */
    function fmtTime(t) {
      if (!isFinite(t)) return "--:--.--";
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      const c = Math.floor((t * 100) % 100);
      return m + ":" + String(s).padStart(2, "0") + "." + String(c).padStart(2, "0");
    }

    function updateHud() {
      elLap.textContent = String(Math.min(completedLaps + 1, track.laps));
      elLaps.textContent = String(track.laps);
      elTime.textContent = fmtTime(raceTime);
      elBest.textContent = fmtTime(bestLap);
      elSpeed.textContent = String(Math.round(Math.abs(car.speed) * 0.2));
      if (elScore) elScore.textContent = String(score);
    }

    /* ---------- Game loop ---------- */
    // Fixed 60Hz timestep with an accumulator so the sim runs at the same
    // speed regardless of refresh rate. The loop is driven by setTimeout
    // rather than requestAnimationFrame for reliability (some environments
    // throttle rAF heavily, which would otherwise make the sim crawl).
    const STEP = 1 / 60;
    const LOOP_MS = 1000 / 60;
    let acc = 0;
    let loopId = null;

    function frame() {
      const now = performance.now();
      let dt = lastT ? (now - lastT) / 1000 : 0;
      lastT = now;
      if (dt > 0.25) dt = 0.25; // clamp huge gaps (tab switch, throttling)

      if (state === "race") {
        acc += dt;
        let guard = 0;
        while (acc >= STEP && guard < 200) {
          update(STEP);
          acc -= STEP;
          guard++;
        }
        if (guard >= 200) acc = 0;
      } else {
        acc = 0;
      }

      render();
      loopId = window.setTimeout(frame, LOOP_MS);
    }

    function startLoop() {
      lastT = 0;
      acc = 0;
      if (loopId) window.clearTimeout(loopId);
      loopId = window.setTimeout(frame, LOOP_MS);
    }

    function stopLoop() {
      if (loopId) window.clearTimeout(loopId);
      loopId = null;
    }

    function update(dt) {
      const throttle = keys.up;
      const braking = keys.down;
      const steer = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
      const speedFactor = Math.min(1, Math.abs(car.speed) / (track.maxSpeed * 0.55));
      const dir = car.speed < 0 ? -1 : 1;
      car.heading += steer * STEER * speedFactor * dir * dt;

      if (throttle) car.speed += ACCEL * dt;
      if (braking) {
        if (car.speed > 0.5) car.speed -= BRAKE * dt;
        else car.speed -= REV_ACCEL * dt;
      }
      car.speed *= Math.pow(0.9992, dt * 60);
      car.speed = Math.max(MAX_REV, Math.min(track.maxSpeed, car.speed));

      car.x += Math.cos(car.heading) * car.speed * dt;
      car.y += Math.sin(car.heading) * car.speed * dt;

      const near = nearestTrack(car.x, car.y);
      if (near.dist > track.roadHalf) {
        // driving on grass: strong but recoverable slowdown
        car.speed *= Math.pow(0.98, dt * 60);
        if (near.dist > track.roadHalf * 1.35) {
          // push gently back toward the nearest point on the track line
          // (handles BOTH edges — pushing toward the centre would trap the
          // car deeper in the infield when it runs off the inside)
          const c = track.pts[near.seg];
          const vx = c.x - car.x;
          const vy = c.y - car.y;
          const vl = Math.hypot(vx, vy) || 1;
          const push = Math.min(near.dist - track.roadHalf, 120) * 0.6 * dt;
          car.x += (vx / vl) * push;
          car.y += (vy / vl) * push;
        }
        if (!car.onGrass && Math.abs(car.speed) > 4) beep(90, 0.15, "sawtooth", 0.05);
        car.onGrass = true;
      } else {
        car.onGrass = false;
      }

      const seg = near.seg;
      let d = seg - prevSeg;
      if (d > track.n / 2) d -= track.n;
      if (d < -track.n / 2) d += track.n;
      // only count progress while on the road, so cutting across the grass
      // (or the infield) doesn't register as a lap
      if (Math.abs(car.speed) > 14 && near.dist <= track.roadHalf) lapProgress += d;
      prevSeg = seg;
      while (lapProgress >= track.n) {
        lapProgress -= track.n;
        onLap();
      }

      raceTime += dt;

      // car-following camera (fixed tracks keep a static view)
      if (track.follow) {
        const tx = car.x + Math.cos(car.heading) * track.look;
        const ty = car.y + Math.sin(car.heading) * track.look;
        const k = Math.min(1, 4 * dt);
        camera.x += (tx - camera.x) * k;
        camera.y += (ty - camera.y) * k;
      }

      // endurance test: debris falls onto the road — dodge it for a big score
      obstacleTimer -= dt;
      if (obstacleTimer <= 0 && track.obstacles.length < 5) {
        obstacleTimer = 0.9 + Math.random() * 0.8;
        spawnObstacle(near.seg);
      }
      updateObstacles(dt, near.seg);

      updateHud();
      updateEngineSound();
    }

    function spawnObstacle(carSeg) {
      const n = track.n;
      const ahead = Math.round(n * (0.05 + Math.random() * 0.08));
      const seg = (carSeg + ahead) % n;
      const p = track.pts[seg];
      const nl = track.normals[seg];
      const off = (Math.random() * 2 - 1) * track.roadHalf * 0.55;
      track.obstacles.push({
        x: p.x + nl.x * off,
        y: p.y + nl.y * off,
        seg: seg,
        r: 9 + Math.random() * 4,
        type: Math.floor(Math.random() * 3), // 0 cone, 1 drum, 2 rock
        drop: 0
      });
    }

    function updateObstacles(dt, carSeg) {
      const n = track.n;
      const hitR = track.roadHalf * 0.32;
      for (let i = track.obstacles.length - 1; i >= 0; i--) {
        const o = track.obstacles[i];
        o.drop = Math.min(1, o.drop + dt * 3); // quick fall-in animation
        const dx = car.x - o.x;
        const dy = car.y - o.y;
        const d = Math.hypot(dx, dy);
        if (d < hitR + o.r) {
          // hit — penalty + jolt
          score = Math.max(0, score - 50);
          beep(150, 0.18, "sawtooth", 0.12);
          car.speed *= 0.55;
          track.obstacles.splice(i, 1);
          continue;
        }
        // passed cleanly — bonus for dodging
        const ahead = (carSeg - o.seg + n) % n;
        if (ahead > 1 && ahead < n * 0.4) {
          score += 25;
          beep(880, 0.07, "square", 0.08);
          track.obstacles.splice(i, 1);
        }
      }
    }

    function onLap() {
      const lapTime = raceTime - lapStartTime;
      lapStartTime = raceTime;
      completedLaps++;
      if (lapTime < bestLap) bestLap = lapTime;
      beep(660, 0.09, "square", 0.12);
      beep(990, 0.12, "square", 0.12, 0.1);
      updateHud();
      if (completedLaps >= track.laps) finishRace();
    }

    function finishRace() {
      state = "finished";
      stopEngineSound();
      overlay.querySelector("#res-time").textContent = fmtTime(raceTime);
      overlay.querySelector("#res-best").textContent = fmtTime(bestLap);
      overlay.querySelector("#res-laps").textContent = String(track.laps);
      overlay.querySelector("#res-score").textContent = String(score);
      showScreen("finish");
      hud.hidden = true;
      [523, 659, 784, 1047].forEach(function (f, i) {
        beep(f, 0.16, "square", 0.12, i * 0.14);
      });
      overlay.querySelector("#btn-again").focus();
    }

    function showScreen(name) {
      for (const k in screens) screens[k].hidden = true;
      screens[name].hidden = false;
    }

    /* ---------- Race lifecycle ---------- */
    function resetCar() {
      const p = track.pts[track.startIndex];
      const q = track.pts[(track.startIndex + 1) % track.n];
      car = {
        x: p.x,
        y: p.y,
        heading: Math.atan2(q.y - p.y, q.x - p.x),
        speed: 0,
        onGrass: false
      };
      prevSeg = track.startIndex;
      lapProgress = 0;
      if (track.follow) {
        camera.x = p.x;
        camera.y = p.y;
      } else {
        camera.x = track.camX;
        camera.y = track.camY;
      }
    }

    function startRace() {
      buildTrack(selectedTrack);
      resetCar();
      completedLaps = 0;
      raceTime = 0;
      lapStartTime = 0;
      bestLap = Infinity;
      score = 0;
      obstacleTimer = 0;
      track.obstacles.length = 0;
      for (const k in keys) keys[k] = false;
      state = "race";
      hud.hidden = false;
      updateHud();
      for (const k in screens) screens[k].hidden = true;
      startEngineSound();
      canvas.focus();
    }

    function pauseGame() {
      state = "paused";
      showScreen("paused");
      stopEngineSound();
    }

    function resumeGame() {
      state = "race";
      for (const k in screens) screens[k].hidden = true;
      hud.hidden = false;
      startEngineSound();
    }

    function updateTitleInfo() {
      const def = TRACKS[selectedTrack];
      const tag = overlay.querySelector("#game-tagline");
      if (tag) {
        tag.textContent = def.laps + (def.laps === 1 ? " lap \u00b7 " : " laps \u00b7 ") + def.name;
      }
      overlay.querySelectorAll(".game-track-btn").forEach(function (b) {
        const on = b.getAttribute("data-track") === selectedTrack;
        b.classList.toggle("is-selected", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function openGame() {
      ensureAudio();
      loadGameFont();
      document.body.style.overflow = "hidden";
      lastFocused = document.activeElement;
      overlay.hidden = false;
      overlay.classList.add("is-open");
      for (const k in keys) keys[k] = false;
      state = "idle";
      buildTrack(selectedTrack);
      updateTitleInfo();
      hud.hidden = true;
      showScreen("title");
      render();
      startLoop();
      overlay.querySelector("#btn-start-race").focus();
    }

    function closeGame() {
      stopLoop();
      stopEngineSound();
      state = "idle";
      document.body.style.overflow = "";
      for (const k in keys) keys[k] = false;
      overlay.classList.remove("is-open");
      overlay.hidden = true;
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    /* ---------- Rendering ---------- */
    function tracePolyline(pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
    }

    function roundedRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function render() {
      // backdrop (out-of-bounds)
      ctx.fillStyle = "#0b150e";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.save();
      // camera transform: screen = (world - camera) * zoom, centred
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
      ctx.scale(track.zoom, track.zoom);
      ctx.translate(-camera.x, -camera.y);

      const vw = CANVAS_W / track.zoom;
      const vh = CANVAS_H / track.zoom;
      const vx0 = camera.x - vw / 2;
      const vy0 = camera.y - vh / 2;

      // grass over the whole world (generous margin)
      ctx.fillStyle = "#2F6B3C";
      ctx.fillRect(-3200, -3200, 6400, 6400);
      // mowing stripes
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let x = -3200; x < 3200; x += 96) ctx.fillRect(x, -3200, 48, 6400);

      // subtle world grid — helps read motion when the camera follows
      if (track.follow) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const g0 = Math.floor(vx0 / 220) * 220;
        for (let gx = g0; gx < vx0 + vw + 220; gx += 220) {
          ctx.moveTo(gx, vy0);
          ctx.lineTo(gx, vy0 + vh);
        }
        const gy0 = Math.floor(vy0 / 220) * 220;
        for (let gy = gy0; gy < vy0 + vh + 220; gy += 220) {
          ctx.moveTo(vx0, gy);
          ctx.lineTo(vx0 + vw, gy);
        }
        ctx.stroke();
      }

      // trees (only those near the view)
      for (const t of track.trees) {
        if (t.x < vx0 - 60 || t.x > vx0 + vw + 60 || t.y < vy0 - 60 || t.y > vy0 + vh + 60) continue;
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath();
        ctx.arc(t.x + 2, t.y + 3, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2C5B34";
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3C7A44";
        ctx.beginPath();
        ctx.arc(t.x - t.r * 0.25, t.y - t.r * 0.25, t.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      // road band
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#4A5159";
      ctx.lineWidth = track.roadHalf * 2;
      tracePolyline(track.pts);
      ctx.stroke();

      // subtle asphalt stripes
      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      ctx.lineWidth = 2;
      ctx.setLineDash([26, 60]);
      tracePolyline(track.pts);
      ctx.stroke();
      ctx.setLineDash([]);

      // edge lines
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 12]);
      tracePolyline(track.edgeOuter);
      ctx.stroke();
      tracePolyline(track.edgeInner);
      ctx.stroke();
      ctx.setLineDash([]);

      // center line
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 16]);
      tracePolyline(track.pts);
      ctx.stroke();
      ctx.setLineDash([]);

      // start / finish line
      drawStartLine();

      // falling debris on the road
      for (const o of track.obstacles) {
        if (o.x < vx0 - 60 || o.x > vx0 + vw + 60 || o.y < vy0 - 60 || o.y > vy0 + vh + 60) continue;
        const s = o.drop;
        const rad = o.r * (0.3 + 0.7 * s);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(o.x + 2, o.y + 3, rad, rad * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        if (o.type === 0) {
          // traffic cone
          ctx.fillStyle = "#E8602F";
          ctx.beginPath();
          ctx.moveTo(o.x, o.y - rad);
          ctx.lineTo(o.x - rad * 0.7, o.y + rad);
          ctx.lineTo(o.x + rad * 0.7, o.y + rad);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillRect(o.x - rad * 0.45, o.y - rad * 0.05, rad * 0.9, rad * 0.35);
        } else if (o.type === 1) {
          // oil drum
          ctx.fillStyle = "#3B6EA5";
          ctx.beginPath();
          ctx.arc(o.x, o.y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(o.x, o.y, rad * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // rock
          ctx.fillStyle = "#7A818C";
          ctx.beginPath();
          ctx.moveTo(o.x - rad, o.y + rad * 0.4);
          ctx.lineTo(o.x - rad * 0.4, o.y - rad);
          ctx.lineTo(o.x + rad * 0.6, o.y - rad * 0.4);
          ctx.lineTo(o.x + rad, o.y + rad * 0.5);
          ctx.closePath();
          ctx.fill();
        }
      }

      // car
      drawCar();

      ctx.restore();
    }

    function drawStartLine() {
      const n = track.normals[0];
      const a = { x: track.pts[0].x + n.x * (track.roadHalf - 8), y: track.pts[0].y + n.y * (track.roadHalf - 8) };
      const b = { x: track.pts[0].x - n.x * (track.roadHalf - 8), y: track.pts[0].y - n.y * (track.roadHalf - 8) };
      const len = (track.roadHalf - 8) * 2;
      const seg = 13;
      const ux = (b.x - a.x) / len;
      const uy = (b.y - a.y) / len;
      const px = -uy;
      const py = ux;
      const thick = 15;
      for (let s = 0; s < len; s += seg) {
        const c0x = a.x + ux * s;
        const c0y = a.y + uy * s;
        const c1x = a.x + ux * Math.min(s + seg, len);
        const c1y = a.y + uy * Math.min(s + seg, len);
        ctx.fillStyle = Math.floor(s / seg) % 2 === 0 ? "#f1efe9" : "#1b1b1b";
        ctx.beginPath();
        ctx.moveTo(c0x, c0y);
        ctx.lineTo(c1x, c1y);
        ctx.lineTo(c1x + px * thick, c1y + py * thick);
        ctx.lineTo(c0x + px * thick, c0y + py * thick);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawCar() {
      if (!car) return;
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.heading);
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(1, 3, 17, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // wheels
      ctx.fillStyle = "#1E2126";
      [[-13, -8.5], [13, -8.5], [-13, 8.5], [13, 8.5]].forEach(function (w) {
        ctx.beginPath();
        ctx.ellipse(w[0], w[1], 3.6, 5.4, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      // body (red bubble car)
      ctx.fillStyle = "#B8322E";
      roundedRect(ctx, -15, -9.5, 30, 19, 7);
      ctx.fill();
      // front indicator lights
      ctx.fillStyle = "#F3C74F";
      ctx.fillRect(14.5, -6.5, 3, 3);
      ctx.fillRect(14.5, 3.5, 3, 3);
      // canopy bubble
      ctx.fillStyle = "#8CC8D8";
      ctx.beginPath();
      ctx.ellipse(0, -2, 10.5, 6.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.ellipse(-2.5, -3.2, 4.6, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // tail fin
      ctx.fillStyle = "#B8322E";
      ctx.beginPath();
      ctx.moveTo(-14, -5);
      ctx.lineTo(-18.5, 0);
      ctx.lineTo(-14, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* ---------- Input ---------- */
    function onKeyDown(e) {
      if (!overlay.classList.contains("is-open")) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") keys.up = true;
      if (k === "arrowdown" || k === "s") keys.down = true;
      if (k === "arrowleft" || k === "a") keys.left = true;
      if (k === "arrowright" || k === "d") keys.right = true;

      if (e.key === "Escape") {
        if (state === "race") pauseGame();
        else if (state === "paused") resumeGame();
        else closeGame();
      } else if ((e.key === "Enter" || e.code === "Space") && state !== "race") {
        if (!screens.title.hidden || !screens.finish.hidden) startRace();
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) !== -1 || e.code === "Space") {
        e.preventDefault();
      }
    }

    function onKeyUp(e) {
      if (!overlay.classList.contains("is-open")) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") keys.up = false;
      if (k === "arrowdown" || k === "s") keys.down = false;
      if (k === "arrowleft" || k === "a") keys.left = false;
      if (k === "arrowright" || k === "d") keys.right = false;
    }

    /* ---------- Font ---------- */
    function loadGameFont() {
      if (document.getElementById("kr200-font")) return;
      const link = document.createElement("link");
      link.id = "kr200-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      document.head.appendChild(link);
    }

    /* ---------- Wiring ---------- */
    overlay.querySelector("#btn-start-race").addEventListener("click", startRace);
    overlay.querySelector("#btn-again").addEventListener("click", startRace);
    overlay.querySelector("#btn-exit").addEventListener("click", closeGame);
    overlay.querySelector("#game-close").addEventListener("click", closeGame);
    overlay.querySelector("#game-mute").addEventListener("click", function () {
      setMuted(!muted);
    });

    overlay.querySelectorAll(".game-track-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        selectedTrack = b.getAttribute("data-track");
        try {
          localStorage.setItem("mfgb-track", selectedTrack);
        } catch (err) {
          /* ignore */
        }
        buildTrack(selectedTrack);
        updateTitleInfo();
        render();
      });
    });

    overlay.querySelectorAll(".game-touch button").forEach(function (b) {
      const k = b.getAttribute("data-k");
      const press = function (e) {
        e.preventDefault();
        keys[k] = true;
      };
      const release = function (e) {
        e.preventDefault();
        keys[k] = false;
      };
      b.addEventListener("pointerdown", press);
      b.addEventListener("pointerup", release);
      b.addEventListener("pointercancel", release);
      b.addEventListener("pointerleave", release);
    });

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // clean up stuck keys if the window loses focus mid-race
    window.addEventListener("blur", function () {
      for (const k in keys) keys[k] = false;
    });

    // remember the player's track choice
    try {
      const saved = localStorage.getItem("mfgb-track");
      if (saved === "test" || saved === "ring") selectedTrack = saved;
    } catch (err) {
      /* ignore */
    }

    return {
      open: openGame,
      close: closeGame
    };
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
     09. Initialisation
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
    const game = initKr200Game();
    initEngineToggle(game);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
