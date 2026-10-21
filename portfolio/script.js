(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Year ----
  $("#year").textContent = new Date().getFullYear();

  // ---- Theme toggle (remembered) ----
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("theme");
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}
  $("#themeToggle").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // ---- Mobile menu ----
  var links = $("#navLinks");
  $("#menuBtn").addEventListener("click", function () { links.classList.toggle("open"); });
  $$("#navLinks a").forEach(function (a) {
    a.addEventListener("click", function () { links.classList.remove("open"); });
  });

  // ---- Scroll progress, sticky nav, active link ----
  var nav = $("#nav"), progress = $("#progress");
  var sections = $$("main section[id]");
  var navAnchors = $$("#navLinks a");
  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    nav.classList.toggle("scrolled", y > 20);
    var current = sections[0].id;
    sections.forEach(function (s) {
      if (y + 140 >= s.offsetTop) current = s.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Cursor glow ----
  var glow = $("#glow");
  if (!reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    window.addEventListener("mousemove", function (e) {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    });
  }

  // ---- Typing effect ----
  var words = ["Frontend Developer", "React Developer", "UI Builder", "Problem Solver", "Web Enthusiast"];
  var typed = $("#typed"), wi = 0, ci = 0, deleting = false;
  function type() {
    var word = words[wi];
    typed.textContent = word.substring(0, ci);
    var delay = deleting ? 45 : 95;
    if (!deleting && ci === word.length) { deleting = true; delay = 1500; }
    else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 350; }
    ci += deleting ? -1 : 1;
    setTimeout(type, delay);
  }
  if (reduceMotion) { typed.textContent = words[0]; } else { type(); }

  // ---- Reveal on scroll + skill bars + counters ----
  function animateCount(el) {
    var to = parseInt(el.getAttribute("data-to"), 10), start = null, dur = 1400;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add("show");
      $$(".bar i", el).forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
      $$(".count", el).forEach(animateCount);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 90 + "ms";
    io.observe(el);
  });

  // ---- 3D tilt on project cards ----
  if (!reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    $$("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateY(" + x * 9 + "deg) rotateX(" + -y * 9 + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  // ---- Contact form (sends through FormSubmit) ----
  var form = $("#contactForm"), note = $("#formNote");
  var TO_EMAIL = "frimpongkelvin500@gmail.com";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#name").value.trim(), email = $("#email").value.trim(), msg = $("#message").value.trim();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !ok || !msg) {
      note.className = "form-note error";
      note.textContent = "Please fill in your name, a valid email and a message.";
      return;
    }
    var submitButton = $('button[type="submit"]', form);
    submitButton.disabled = true;
    note.className = "form-note";
    note.textContent = "Sending your message...";
    fetch("https://formsubmit.co/ajax/" + TO_EMAIL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        name: name,
        email: email,
        message: msg,
        _subject: "Portfolio message from " + name
      })
    }).then(function (response) {
      return response.text().then(function (text) {
        var result;
        try {
          result = JSON.parse(text);
        } catch (error) {
          throw new Error("The form service returned an unreadable response.");
        }
        if (!response.ok || (result.success !== "true" && result.success !== true)) {
          throw new Error(result.message || "The form service rejected the message.");
        }
        return result;
      });
    }).then(function (result) {
      note.className = "form-note";
      note.textContent = "Thanks, " + name + "! Your message has been sent.";
      form.reset();
    }).catch(function (error) {
      console.error("Contact form submission failed:", error);
      note.className = "form-note error";
      note.textContent = "Your message could not be sent: " + error.message +
        " If this is your first submission, confirm the activation email from FormSubmit. You can also email frimpongkelvin500@gmail.com.";
    }).finally(function () {
      submitButton.disabled = false;
    });
  });
})();
