/* ===========================================================
   STTPS — site interactions (vanilla JS, no dependencies)
   =========================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- nav: scrolled state + mobile toggle ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var links = document.querySelector(".nav-links");

  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    links.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en, i) {
          if (en.isIntersecting) {
            // small natural stagger within a viewport batch
            setTimeout(function () { en.target.classList.add("in"); }, (i % 4) * 80);
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    var co = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- contact form (no backend — opens mail client) ---------- */
  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      if (!name || !email) {
        showNote("Please add your name and email so we can respond.");
        return;
      }
      var subject = "STTPS Enquiry — " + (data.get("service") || "General");
      var body =
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Phone: " + (data.get("phone") || "-") + "\n" +
        "Service: " + (data.get("service") || "-") + "\n\n" +
        (data.get("message") || "");
      window.location.href =
        "mailto:help@sttps.co.za?subject=" +
        encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      showNote("Opening your mail client… If nothing happens, email us at help@sttps.co.za");
      form.reset();
    });
  }
  function showNote(msg) {
    if (!note) return;
    note.textContent = msg;
    note.hidden = false;
  }

  /* ---------- particle network background ---------- */
  var canvas = document.getElementById("net");
  if (!canvas || reduceMotion) return;
  var ctx = canvas.getContext("2d");
  var W, H, dpr, points = [], raf;
  var mouse = { x: -9999, y: -9999 };

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    var density = Math.min(Math.floor((W * H) / 18000), 90);
    points = [];
    for (var i = 0; i < density; i++) {
      points.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var maxD = 140;
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      // subtle attraction to cursor
      var dxm = mouse.x - p.x, dym = mouse.y - p.y;
      var dm = Math.sqrt(dxm * dxm + dym * dym);
      if (dm < 170) { p.x += dxm * 0.0016; p.y += dym * 0.0016; }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(62,232,154,0.55)";
      ctx.fill();

      for (var j = i + 1; j < points.length; j++) {
        var q = points[j];
        var dx = p.x - q.x, dy = p.y - q.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxD) {
          var a = (1 - d / maxD) * 0.32;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = "rgba(38,217,134," + a + ")";
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(draw);
  }

  window.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener("mouseout", function () { mouse.x = -9999; mouse.y = -9999; });

  var resizeT;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(size, 180);
  });

  // pause when tab hidden (saves CPU)
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { raf = requestAnimationFrame(draw); }
  });

  size();
  draw();
})();
