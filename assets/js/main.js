(function () {
  "use strict";

  var FORM_ENDPOINT = "";
  var MAIL_TO = "sskbuildersupply.ph@gmail.com";

  /* ---------- language ---------- */
  var html = document.documentElement;

  function detectLang() {
    var saved = null;
    try { saved = localStorage.getItem("ssk-lang"); } catch (e) {}
    if (saved === "zh" || saved === "en") return saved;
    var nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  function applyLang(lang) {
    html.setAttribute("lang", lang);
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var val = el.getAttribute("data-" + lang);
      if (val !== null) el.innerHTML = val;
    });
    document.querySelectorAll("[data-en-ph]").forEach(function (el) {
      var val = el.getAttribute("data-" + lang + "-ph");
      if (val !== null) el.setAttribute("placeholder", val);
    });
    var title =
      lang === "zh"
        ? "SSK 建筑集团 — 门窗 · 幕墙 · 阳光房 | 菲律宾马尼拉"
        : "SSK Construction Group — Doors, Windows & Curtain Walls | Manila, Philippines";
    document.title = title;
    try { localStorage.setItem("ssk-lang", lang); } catch (e) {}
  }

  applyLang(detectLang());

  var langToggle = document.getElementById("langToggle");
  langToggle.addEventListener("click", function () {
    applyLang(html.getAttribute("lang") === "en" ? "zh" : "en");
  });

  /* ---------- header ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = document.getElementById("navBurger");
  var nav = document.getElementById("mainNav");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el, i) {
      el.style.setProperty("--d", (i % 4) * 0.08 + "s");
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbImage = document.getElementById("lbImage");
  var lbCaption = document.getElementById("lbCaption");
  var lbCount = document.getElementById("lbCount");
  var lbIndex = 0;
  var lbImages = [];
  var lbTitle = "";

  function lbRender() {
    var file = lbImages[lbIndex];
    // When a gallery has a single image, hide the prev/next controls.
    var single = lbImages.length <= 1;
    document.getElementById("lbPrev").hidden = single;
    document.getElementById("lbNext").hidden = single;
    lbImage.alt = lbTitle + " " + (lbIndex + 1);
    lbCaption.textContent =
      lbTitle + " — " + (lbIndex + 1) + " / " + lbImages.length;
    lbCount.textContent = (lbIndex + 1) + " / " + lbImages.length;

    // Hide the image while the new one loads, so we never keep showing the
    // previous (stale) frame after clicking next/prev — this is what made
    // every image appear twice.
    lbImage.classList.add("is-loading");
    lbImage.onload = function () {
      lbImage.classList.remove("is-loading");
      lbImage.onload = null;
      lbImage.onerror = null;
    };
    lbImage.onerror = function () {
      lbImage.classList.remove("is-loading");
      lbImage.onload = null;
      lbImage.onerror = null;
    };
    lbImage.src = "assets/img/" + file;
  }

  // Preload AND decode every image in the gallery so switching is truly instant
  // (no waiting for download/decode on the first click of next/prev).
  function lbPreload() {
    lbImages.forEach(function (file) {
      var im = new Image();
      im.src = "assets/img/" + file;
      if (im.decode) {
        im.decode().catch(function () {});
      }
    });
  }

  function lbOpen(card) {
    lbImages = (card.getAttribute("data-images") || "").split(",");
    lbTitle = card.querySelector(".pc-title").textContent.trim();
    lbIndex = 0;
    lightbox.hidden = false;
    requestAnimationFrame(function () { lightbox.classList.add("open"); });
    document.body.style.overflow = "hidden";
    lbPreload();
    lbRender();
  }

  function lbClose() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { lightbox.hidden = true; }, 350);
  }

  function lbStep(dir) {
    lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
    lbRender();
  }

  document.querySelectorAll(".product-card").forEach(function (card) {
    card.addEventListener("click", function () { lbOpen(card); });
  });
  document.getElementById("lbClose").addEventListener("click", lbClose);
  document.getElementById("lbPrev").addEventListener("click", function () { lbStep(-1); });
  document.getElementById("lbNext").addEventListener("click", function () { lbStep(1); });
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) lbClose();
  });
  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowLeft") lbStep(-1);
    if (e.key === "ArrowRight") lbStep(1);
  });

  /* ---------- contact form ---------- */
  var form = document.getElementById("contactForm");
  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");

  function status(msg, ok) {
    statusEl.textContent = msg;
    statusEl.className = "form-status " + (ok ? "ok" : "err");
  }

  function t(zh, en) {
    return html.getAttribute("lang") === "zh" ? zh : en;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var name = (data.get("name") || "").toString().trim();
    var contact = (data.get("contact") || "").toString().trim();
    var message = (data.get("message") || "").toString().trim();
    var hp = (data.get("company") || "").toString();

    form.querySelectorAll("input, textarea").forEach(function (el) {
      el.classList.remove("invalid");
    });

    if (hp) return;
    var valid = true;
    if (!name) { form.querySelector('[name="name"]').classList.add("invalid"); valid = false; }
    if (!contact) { form.querySelector('[name="contact"]').classList.add("invalid"); valid = false; }
    if (!message) { form.querySelector('[name="message"]').classList.add("invalid"); valid = false; }
    if (!valid) {
      status(t("请填写所有必填项。", "Please fill in all required fields."), false);
      return;
    }

    submitBtn.disabled = true;
    status(t("发送中…", "Sending…"), true);

    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, contact: contact, message: message })
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status(t("留言已发送，我们会尽快回复您。", "Message sent! We'll get back to you soon."), true);
          } else {
            throw new Error("bad response");
          }
        })
        .catch(function () {
          status(t("发送失败，请直接邮件联系我们。", "Something went wrong — please email us directly."), false);
        })
        .finally(function () { submitBtn.disabled = false; });
    } else {
      var subject = encodeURIComponent("Website inquiry from " + name);
      var body = encodeURIComponent(
        "Name: " + name + "\nContact: " + contact + "\n\n" + message
      );
      window.location.href = "mailto:" + MAIL_TO + "?subject=" + subject + "&body=" + body;
      status(t("已打开邮件客户端，感谢您的咨询。", "Opening your mail client — thank you!"), true);
      submitBtn.disabled = false;
    }
  });
})();
