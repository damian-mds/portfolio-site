/**
 * scripts.js — Portfolio site logic
 * Uses GSAP, ScrollTrigger, and Lenis smooth scroll.
 */

// ============================================================================
// Typewriter effect
// ============================================================================
var TxtType = function (el, toRotate, period) {
  this.toRotate = toRotate;
  this.el = el;
  this.loopNum = 0;
  this.period = parseInt(period, 10) || 2000;
  this.txt = "";
  this.isDeleting = false;
  this.tick();
};

TxtType.prototype.tick = function () {
  var i = this.loopNum % this.toRotate.length;
  var fullTxt = this.toRotate[i];

  if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
  } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
  }

  this.el.innerHTML = '<span class="wrap">' + this.txt + "</span>";

  var that = this;
  var delta = 200 - Math.random() * 100;

  if (this.isDeleting) {
    delta /= 2;
  }

  if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    this.isDeleting = true;
  } else if (this.isDeleting && this.txt === "") {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
  }

  setTimeout(function () {
    that.tick();
  }, delta);
};

// ============================================================================
// Navbar — scroll opacity + active section highlighting
// ============================================================================
(function () {
  var nav = document.querySelector(".navbar");
  if (!nav) return;
  var threshold = 80;
  var links = nav.querySelectorAll(".nav-links a");

  /* Scroll to absolute Y position — Lenis-aware, handles pinned elements */
  function scrollToPos(targetY) {
    if (window.lenisInstance) {
      window.lenisInstance.scrollTo(targetY, { offset: 0 });
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }

  function getActiveSectionId() {
    var sections = document.querySelectorAll(".section");
    for (var i = sections.length - 1; i >= 0; i--) {
      var rect = sections[i].getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5 && rect.bottom > 0) {
        return sections[i].getAttribute("id");
      }
    }
    return null;
  }

  function updateActiveLink() {
    var currentId = getActiveSectionId();
    links.forEach(function (link) {
      var href = link.getAttribute("href");
      var sectionId = href.substring(1);
      var isActive = sectionId === currentId;

      if (isActive) {
        link.classList.add("active-link");
        if (hoveredLink === link) {
          link.style.opacity = "";
        }
      } else {
        link.classList.remove("active-link");
        if (hoveredLink === link) {
          link.style.opacity = "0.7";
        } else {
          link.style.opacity = "";
        }
      }
    });
  }

  function onScroll() {
    var scrollY = window.lenisInstance
      ? window.lenisInstance.scroll
      : window.scrollY;
    nav.classList.toggle("scrolled", scrollY > threshold);
    updateActiveLink();
  }

  /* Subscribe to scroll — use lenis.on() if available, fallback to native */
  if (window.lenisInstance) {
    window.lenisInstance.on("scroll", onScroll, { passive: true });
  } else {
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var hoveredLink = null;

  links.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var href = link.getAttribute("href");
      var target = document.querySelector(href);
      if (target) {
        var targetRect = target.getBoundingClientRect();
        var targetScrollY = window.scrollY + targetRect.top;
        scrollToPos(targetScrollY);
      }
    });
    link.addEventListener("mouseenter", function () {
      hoveredLink = link;
      var href = link.getAttribute("href");
      var sectionId = href.substring(1);
      var currentId = getActiveSectionId();
      if (sectionId !== currentId) {
        link.style.opacity = "0.7";
      } else {
        link.style.opacity = "";
      }
    });
    link.addEventListener("mouseleave", function () {
      if (hoveredLink === link) {
        hoveredLink = null;
      }
      link.style.opacity = "";
    });
  });

  onScroll();

  /* Sync nav on hash changes (e.g. clicking a nav link) */
  window.addEventListener("hashchange", function () {
    var hash = window.location.hash.substring(1);
    var section = document.getElementById(hash);
    if (section) {
      var old = document.querySelector(".section.active");
      if (old) old.classList.remove("active");
      section.classList.add("active");
      onScroll();
      var targetRect = section.getBoundingClientRect();
      var targetScrollY = window.scrollY + targetRect.top;
      scrollToPos(targetScrollY);
    }
  });
})();

// ============================================================================
// Initialize: typewriter, videos, Lenis smooth scroll
// (no DOMContentLoaded needed — script is defer'd, so DOM is already ready)
// ============================================================================
// Boneyard variables MUST be declared here (before main IIFE) so they're
// initialized when initVideoBoneyard() runs at line 193.
var _boneyard = null;
var _swapQueue = []; // { target: <div>, video: <video> }
var _homeSwapScheduled = false;

(function () {
  /* --- Typewriter --- */
  var elements = document.getElementsByClassName("typewrite");
  for (var i = 0; i < elements.length; i++) {
    var toRotate = elements[i].getAttribute("data-type");
    var period = elements[i].getAttribute("data-period");
    if (toRotate) {
      try {
        new TxtType(elements[i], JSON.parse(toRotate), period);
      } catch (e) {
        new TxtType(
          elements[i],
          toRotate.replace(/[\[\]"]+/g, "").split(","),
          period,
        );
      }
    }
  }

  /* --- Boneyard: preload ALL videos off-screen, swap on-ready --- */
  initVideoBoneyard();

  /* Sync sound toggle icon */
  if (window._syncSoundIcon) window._syncSoundIcon();

  /* --- Create and start Lenis smooth scroll --- */
  if (typeof Lenis !== "undefined") {
    window.lenisInstance = new Lenis({
      wrapper: window,
      content: document.documentElement,
      smoothWheel: true,
      lerp: 0.05,
      autoResize: true,
    });
    /* Block native scrolling on the document root so Lenis is the sole
       scroll manager. Without this, wheel events fire on the window but
       the browser ignores preventDefault() because overflow: visible. */
    var root = document.documentElement;
    root.style.overflow = "hidden";
    root.style.overflowX = "hidden";
    root.style.overflowY = "hidden";
    /* Also hide body overflow to be safe */
    document.body.style.overflow = "hidden";

    /* Bridge: update ScrollTrigger on every Lenis frame */
    window.lenisInstance.on("scroll", ScrollTrigger.update);
    window.lenisInstance.start();
    /* Force recalculation of the correct scroll position */
    window.lenisInstance.scrollTo(0, { force: true });

    /* Push Lenis scroll position back to the window so the viewport actually
       moves. When overflow is hidden, window.scrollTo() works — Lenis
       manages animatedScroll and we mirror it to the browser. */
    (function loop() {
      window.lenisInstance.raf(window.performance.now());
      /* Mirror Lenis scroll to the viewport (required when overflow: hidden) */
      window.scrollTo(0, window.lenisInstance.scroll);
      requestAnimationFrame(loop);
    })();

    /* Create a scroller wrapper for all ScrollTrigger.create() calls */
    window.lenisScroller = {
      element: window.lenisInstance.wrapper || document.documentElement,
      get scrollY() {
        return window.lenisInstance.scroll;
      },
      get scrollHeight() {
        return document.documentElement.scrollHeight;
      },
    };
  }
})();

// ============================================================================
// Video Boneyard: preload all videos off-screen, swap to visible position
// when ready (no black flash on load).
// ============================================================================

function createVideoPlaceholder(target, fromBoneyard) {
  if (!target) return null;

  /* Already a video element */
  if (target.tagName === "VIDEO") {
    if (target.querySelector("source")) return target;
    var src = target.getAttribute("data-video-src") || "";
    if (!src) return null;
    var source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    target.appendChild(source);
    target.load();
    return target;
  }

  var src = target.getAttribute("data-video-src") || "";
  if (!src) return null;

  var video = document.createElement("video");
  video.className = target.className;
  video.id = target.id;
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsinline = true;
  video.disablePictureInPicture = true;
  video.dataset.videoSrc = src;

  var source = document.createElement("source");
  source.src = src;
  source.type = "video/mp4";
  video.appendChild(source);

  if (fromBoneyard) {
    /* Put in boneyard for off-screen preload, mark placeholder with skeleton */
    target.classList.add("is-skeleton");
    _boneyard.appendChild(video);
  } else {
    /* Replace placeholder directly (visible) */
    target.parentNode.replaceChild(video, target);
    if (target.style.cssText) {
      video.style.cssText = target.style.cssText;
    }
  }

  /* Track for swapping (home video path skips queue to avoid leak) */
  if (fromBoneyard) {
    _swapQueue.push({ target: target, video: video });
  }

  /* Start playing immediately (in boneyard) */
  video.play().catch(function () {});

  return video;
}

function initVideoBoneyard() {
  /* Create off-screen boneyard container */
  _boneyard = document.createElement("div");
  _boneyard.id = "video-boneyard";
  _boneyard.setAttribute("aria-hidden", "true");
  document.body.appendChild(_boneyard);

  /* Handle the home video: if it's already a VIDEO (by cached script),
     move it to boneyard for off-screen buffering, then swap back to visible
     once ready. If it's a DIV, create it directly visible (in viewport). */
  var homeTarget = document.querySelector(".bg-video");
  if (homeTarget) {
    if (homeTarget.tagName === "VIDEO") {
      /* Already rendered by old/cached script — register for boneyard */
      _swapQueue.push({ target: homeTarget, video: homeTarget });
      /* Try to swap it back (it's in viewport from load time) */
      if (homeTarget.readyState >= 2) {
        /* Already ready — keep visible, remove from swap queue */
        var idx = _swapQueue.indexOf(homeTarget);
        if (idx > -1) _swapQueue.splice(idx, 1);
      } else {
        /* Not ready yet — move to boneyard, will swap when ready */
        /* Save original position for re-insertion when ready */
        var originalParent = homeTarget.parentNode;
        var originalNextSibling = homeTarget.nextElementSibling;

        _boneyard.appendChild(homeTarget);
        homeTarget.play().catch(function () {});

        /* Swap back once ready (home is in viewport, not a gallery-slide).
           The scrollTick skips home entries because they're not in .gallery-slide,
           so we poll specifically for ready home video elements. */
        (function checkHomeReady() {
          if (homeTarget.readyState >= 2) {
            /* Move back to original position in #home */
            if (homeTarget.parentNode !== originalParent) {
              originalParent.insertBefore(homeTarget, originalNextSibling);
            }
            /* Remove from swap queue */
            var qIdx = _swapQueue.indexOf(homeTarget);
            if (qIdx > -1) _swapQueue.splice(qIdx, 1);
            return;
          }
          setTimeout(checkHomeReady, 500);
        })();
      }
    } else {
      /* DIV placeholder — create visible (in viewport from load) with skeleton */
      homeTarget.classList.add("is-skeleton");
      var newVideo = createVideoPlaceholder(homeTarget, false);
      /* Listen for first frame — remove skeleton when video is ready */
      if (newVideo && newVideo.tagName === "VIDEO") {
        var removeSkeleton = function () {
          homeTarget.classList.remove("is-skeleton");
          newVideo.removeEventListener("canplay", removeSkeleton);
          newVideo.removeEventListener("loadeddata", removeSkeleton);
        };
        newVideo.addEventListener("canplay", removeSkeleton, { once: true });
        newVideo.addEventListener("loadeddata", removeSkeleton, { once: true });
      }
      if (homeTarget.tagName === "VIDEO") {
        homeTarget.muted = true;
        homeTarget.play().catch(function () {});
      }
    }
  }

  /* Handle project videos: create directly in the gallery (visible),
     not in boneyard. Skeleton placeholder stays until video is ready. */
  handleProjectVideos();

  /* Handle project videos: swap from boneyard when ready + in view */
  setupProjectVideoSwaps();
}

function handleProjectVideos() {
  /* Handle all project-video elements (DIVs or VIDEOs) */
  var projectVids = document.querySelectorAll(".project-video");
  projectVids.forEach(function (pvid) {
    if (pvid.tagName === "VIDEO") {
      /* Already visible video (by old script) — register for boneyard */
      _swapQueue.push({ target: pvid, video: pvid });
    } else {
      /* Create directly in the gallery (visible), show skeleton until ready */
      createVideoPlaceholderDirect(pvid);
    }
  });
}

/* Create video directly in the DOM (as sibling of skeleton placeholder),
   not in boneyard. The skeleton (DIV) sits above the video (both
   position: absolute filling the same space). When the video is ready,
   the skeleton class is removed, revealing the video underneath. */
function createVideoPlaceholderDirect(target) {
  if (!target) return null;

  /* Already a video element */
  if (target.tagName === "VIDEO") {
    if (target.querySelector("source")) return target;
    var src = target.getAttribute("data-video-src") || "";
    if (!src) return null;
    var source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    target.appendChild(source);
    target.load();
    return target;
  }

  var src = target.getAttribute("data-video-src") || "";
  if (!src) return null;

  var video = document.createElement("video");
  video.className = target.className;
  video.id = target.id;
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsinline = true;
  video.disablePictureInPicture = true;
  video.dataset.videoSrc = src;

  var source = document.createElement("source");
  source.src = src;
  source.type = "video/mp4";
  video.appendChild(source);

  /* Insert the video directly in the DOM (as a sibling of the skeleton).
     The skeleton (DIV, z-index: 1) sits above the video (z-index: 0),
     both filling the same absolute space. When the video is ready,
     the skeleton is hidden, revealing the video underneath. */
  target.parentNode.insertBefore(video, target.nextSibling);
  target.classList.add("is-skeleton");

  /* Track for swapping (hide skeleton when video is ready) */
  _swapQueue.push({ target: target, video: video, direct: true });

  /* Start playing (loads in visible DOM — reliable) */
  video.play().catch(function () {});

  return video;
}

function swapVideoFromBoneyard(entry) {
  if (!entry || !entry.video || !entry.target) return;

  var video = entry.video;
  var target = entry.target;

  /* Only swap if the video is ready (first frame loaded, can play) */
  if (video.readyState < 2) return; /* HAVE_CURRENT_DATA or better */

  /* Remove skeleton/shimmer from placeholder */
  target.classList.remove("is-skeleton");
  target.style.display = "none"; /* hide skeleton, reveal video underneath */

  /* If video IS the target (self-move, by old script), just ensure it's playing */
  if (video === target) {
    video.muted = true;
    video.play().catch(function () {});
  } else if (entry.direct) {
    /* Direct approach: video is already a sibling in the DOM,
       skeleton is just hidden by class — no DOM manipulation needed. */
  } else {
    /* Boneyard approach: move video from boneyard to target's position */
    target.parentNode.replaceChild(video, target);
    if (target.style.cssText) {
      video.style.cssText = target.style.cssText;
    }
  }

  /* Remove the placeholder entry from the queue */
  var idx = _swapQueue.indexOf(entry);
  if (idx > -1) _swapQueue.splice(idx, 1);
}

function setupProjectVideoSwaps() {
  /* Single scroll handler checks visibility for all project videos */
  function scrollTick() {
    _swapQueue.forEach(function (entry) {
      /* Direct approach: video is in the visible DOM, just check ready state */
      if (entry.direct) {
        if (entry.video && entry.video.readyState >= 2) {
          swapVideoFromBoneyard(entry);
        }
        return;
      }
      var slide = entry.target.closest(".gallery-slide");
      if (!slide) return;
      var rect = slide.getBoundingClientRect();
      var inView =
        rect.left < window.innerWidth &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.bottom > 0;
      if (inView && entry.video && entry.video.readyState >= 2) {
        swapVideoFromBoneyard(entry);
      }
    });
  }

  window.addEventListener("scroll", scrollTick, { passive: true });
  window.addEventListener("resize", scrollTick, { passive: true });
  if (window.lenisInstance) {
    window.lenisInstance.on("scroll", scrollTick, { passive: true });
  }

  /* Poll readiness every 200ms (videos take time to buffer) */
  setInterval(function () {
    _swapQueue = _swapQueue.filter(function (entry) {
      /* Direct approach: video is in the visible DOM, check ready state only */
      if (
        entry.direct &&
        entry.video &&
        entry.video.readyState >= 2
      ) {
        swapVideoFromBoneyard(entry);
        return false; /* removed */
      }
      /* Boneyard approach: check ready state + in view */
      if (
        entry.video &&
        entry.video.readyState >= 2 &&
        entry.target.closest(".gallery-slide")
      ) {
        var slide = entry.target.closest(".gallery-slide");
        var rect = slide.getBoundingClientRect();
        var inView =
          rect.left < window.innerWidth &&
          rect.right > 0;
        if (inView) {
          swapVideoFromBoneyard(entry);
          return false; /* removed */
        }
      }
      return true; /* keep polling */
    });
  }, 200);
}

// ============================================================================
// Sound toggle button
// ============================================================================
function syncSoundIcon() {
  var bgVideo = document.querySelector(".bg-video");
  if (!bgVideo) return;
  var soundOn = !bgVideo.muted;
  var toggle = document.getElementById("sound-toggle");
  if (!toggle) return;
  toggle.querySelector(".text-on").style.display = soundOn ? "block" : "none";
  toggle.querySelector(".text-off").style.display = soundOn ? "none" : "block";
  toggle.setAttribute("aria-label", soundOn ? "Mute sound" : "Play sound");
}
window._syncSoundIcon = syncSoundIcon;

(function () {
  var toggle = document.getElementById("sound-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", function () {
    var bgVideo = document.querySelector(".bg-video");
    if (!bgVideo) return;
    bgVideo.muted = !bgVideo.muted;
    if (!bgVideo.muted) {
      bgVideo.muted = false;
      bgVideo.volume = 0.2;
      bgVideo.play().catch(function () {});
    }
    window._syncSoundIcon();
  });
})();

// ============================================================================
// Auckland time widget
// ============================================================================
(function () {
  var $temp = document.getElementById("time-temp");
  var $desc = document.getElementById("time-desc");

  function update() {
    var now = new Date();
    var options = {
      timeZone: "Pacific/Auckland",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    var timeStr = now.toLocaleString("en-NZ", options);
    if ($temp) $temp.textContent = timeStr;

    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Auckland",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(now);
    var day = parts.find(function (p) {
      return p.type === "day";
    }).value;
    var month = now.toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      month: "short",
    });
    var dateStr = day + " " + month + " | AKL NZ";
    if ($desc) $desc.textContent = dateStr;
  }

  update();
  setInterval(update, 1000);
})();

// ============================================================================
// About section — lines fade in as the section scrolls into view
// (native scroll, Lenis-aware via ScrollTrigger.update hook)
// ============================================================================
(function () {
  var aboutSection = document.getElementById("about");
  var paragraphs = document.querySelectorAll(".about-paragraph");
  if (!aboutSection || paragraphs.length === 0) return;

  var lines = aboutSection.querySelectorAll(".about-line");
  if (lines.length === 0) return;

  var lineCount = lines.length;

  function animateLines() {
    var rect = aboutSection.getBoundingClientRect();
    var vh = window.innerHeight;

    var sectionTop = rect.top;
    var sectionBottom = rect.bottom;
    var sectionHeight = rect.height;

    var startThreshold = 0.6;
    var endThreshold = 1;

    var visibleTop = Math.max(0, -sectionTop);
    var visibleBottom = Math.max(0, sectionBottom - vh);
    var visibleInSection = Math.max(0, sectionHeight - visibleTop - visibleBottom);

    var progress = visibleInSection / sectionHeight;

    var startFade = startThreshold;
    var endFade = endThreshold;
    var inViewProgress = 0;
    if (progress >= startFade) {
      inViewProgress = Math.min(1, (progress - startFade) / (endFade - startFade));
    }

    var baseOpacity = Math.max(0, Math.min(1, inViewProgress));

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var lineDelay = i / lineCount;
      var lineProgress = Math.max(0, Math.min(1, (inViewProgress - lineDelay * 0.6) / 0.4));

      var eased = lineProgress < 1
        ? lineProgress * lineProgress * (3 - 2 * lineProgress)
        : 1;

      var translateY = (1 - eased) * 40;
      var opacity = eased * baseOpacity;

      line.style.transform = "translateY(" + translateY + "px)";
      line.style.opacity = opacity;
    }
  }

  window.addEventListener("scroll", animateLines, { passive: true });
  window.addEventListener("resize", animateLines, { passive: true });

  /* Subscribe to lenis scroll instead (if available) */
  if (window.lenisInstance) {
    window.lenisInstance.on("scroll", animateLines, { passive: true });
  }
  animateLines();
})();

// ============================================================================
// "Please scroll" → "thank you :)" based on home section scroll progress
// ============================================================================
(function () {
  var homeSection = document.getElementById("home");
  var pleaseScroll = document.querySelector(".please-scroll");
  if (!homeSection || !pleaseScroll) return;

  var originalText = pleaseScroll.textContent;

  function checkScroll() {
    var rect = homeSection.getBoundingClientRect();
    var sectionHeight = rect.height;
    var progress = -rect.top / sectionHeight;
    progress = Math.max(0, Math.min(1, progress));

    if (progress >= 0.8) {
      pleaseScroll.textContent = "thank you :)";
    } else {
      pleaseScroll.textContent = originalText;
    }
  }

  window.addEventListener("scroll", checkScroll, { passive: true });

  /* Also listen to lenis scroll (if available) */
  if (window.lenisInstance) {
    window.lenisInstance.on("scroll", checkScroll, { passive: true });
  }
  checkScroll();
})();

// ============================================================================
// Works section — horizontal gallery with GSAP ScrollTrigger (Lenis-aware)
// ============================================================================
(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  var worksSection = document.getElementById("works");
  var galleryTrack = document.querySelector(".gallery-track");
  var slides = document.querySelectorAll(".gallery-slide");
  var persistentInfo = document.querySelector(".persistent-project-info");
  if (!worksSection || !galleryTrack || slides.length === 0) return;

  /* Hide in-slide project-info for non-video slides (persistent info takes over) */
  slides.forEach(function (slide) {
    var info = slide.querySelector(".project-info");
    var hasVideo = slide.querySelector(".project-video");
    if (info && !hasVideo) info.style.display = "none";
  });

  /* Populate persistent info with initial slide data */
  function populateInfoFromSlide(slide) {
    if (!slide || !persistentInfo) return;
    var info = slide.querySelector(".project-info");
    if (!info) return;
    var numEl = persistentInfo.querySelector(".project-number");
    var ttlEl = persistentInfo.querySelector(".project-title");
    var descEl = persistentInfo.querySelector(".project-desc");
    var srcNum = info.querySelector(".project-number");
    var srcTtl = info.querySelector(".project-title");
    var srcDesc = info.querySelector(".project-desc");
    if (numEl && srcNum) numEl.textContent = srcNum.textContent;
    if (ttlEl && srcTtl) ttlEl.textContent = srcTtl.textContent;
    if (descEl && srcDesc) descEl.textContent = srcDesc.textContent;
  }

  if (persistentInfo) {
    populateInfoFromSlide(slides[0]);

    /* Show persistent info when works section comes into view */
    ScrollTrigger.create({
      trigger: worksSection,
      start: "top top",
      onEnter: function () { persistentInfo.classList.add("works-visible"); },
    });

    /* Hide persistent info when works section scrolls past */
    ScrollTrigger.create({
      trigger: worksSection,
      start: "bottom top",
      end: "bottom+=200 top",
      onEnter: function () { persistentInfo.classList.remove("works-visible"); },
    });
  }

  var totalSlides = slides.length;

  /* --- Chelsea gallery refs (slide index 1) --- */
  var chGallery = document.querySelector("#slide2-gallery .chelsea-gallery");
  var chPhotos = chGallery ? chGallery.querySelectorAll(".chelsea-photo") : [];
  var chBgs = chGallery ? chGallery.querySelectorAll(".chelsea-bg") : [];
  var totalPhotos = chPhotos.length;
  var chActive = 0;

  /* Init: first photo active, rest hidden */
  for (var _cp = 0; _cp < totalPhotos; _cp++) {
    if (_cp === 0) {
      chPhotos[_cp].classList.add("active");
      if (chBgs[_cp]) chBgs[_cp].classList.add("active");
    } else {
      chPhotos[_cp].classList.remove("active");
      if (chBgs[_cp]) chBgs[_cp].classList.remove("active");
    }
  }

  /* Scroll indicator dots (one per photo) */
  var scrollIndicator = document.querySelector("#slide2-gallery .scroll-indicator");
  var dots = scrollIndicator ? scrollIndicator.querySelectorAll(".indicator-dot") : [];

  function updateDots(idx) {
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.toggle("active", d === idx);
    }
  }

  function goPhoto(idx) {
    if (idx === chActive) return;
    chPhotos[chActive].classList.remove("active");
    if (chBgs[chActive]) chBgs[chActive].classList.remove("active");
    chPhotos[chActive].classList.add("transitioning");
    chPhotos[idx].classList.remove("transitioning");
    chPhotos[idx].classList.add("active");
    if (chBgs[idx]) chBgs[idx].classList.add("active");
    chActive = idx;
    updateDots(idx);
  }

  /* Horizontal scroll: pin section, move track left */
  ScrollTrigger.create({
    trigger: worksSection,
    start: "top top",
    end: "+=" + (totalSlides - 1) * 100 + "%",
    pin: true,
    pinSpacing: true,
    scrub: 0.5,
    ease: "none",
    onUpdate: function (self) {
      var progress = self.progress;

      /* Slide 2 gallery zone boundaries */
      var chStart = 1 / (totalSlides - 1) - 0.5 / (totalSlides - 1);  // 0.25
      var chEnd = 1 / (totalSlides - 1) + 0.5 / (totalSlides - 1);    // 0.75

      /* --- Move gallery track horizontally --- */
      if (progress < chStart) {
        /* Slide 1 → slide 2: track slides from 0 to -100vw */
        var subProgress = progress / chStart;
        subProgress = Math.max(0, Math.min(1, subProgress));
        var eased = subProgress * subProgress * (3 - 2 * subProgress);
        var translateX = -window.innerWidth * eased;
        gsap.set(galleryTrack, { x: translateX });
      } else if (progress <= chEnd) {
        /* Gallery zone: lock track to slide 2 (x: -100vw) */
        gsap.set(galleryTrack, { x: -window.innerWidth });
      } else {
        /* Past gallery zone: slide 2 → slide 3 */
        var normalised = (progress - chEnd) / (1 - chEnd);
        normalised = Math.max(0, Math.min(1, normalised));
        var eased = normalised * normalised * (3 - 2 * normalised);
        var translateX = -window.innerWidth * (1 + eased);
        gsap.set(galleryTrack, { x: translateX });
      }

      /* Persistent info stays visible during horizontal scroll */
      if (persistentInfo) {
        persistentInfo.classList.add("works-visible");

        /* Update persistent info text to match current slide */
        var currentSlide = Math.round(progress * (totalSlides - 1));
        currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide));
        populateInfoFromSlide(slides[currentSlide]);
      }

      /* --- Chelsea gallery (slide 2): cycle all 8 photos across the gallery zone --- */
      if (totalPhotos > 0) {
        /* Hide indicator dots outside the gallery zone */
        if (scrollIndicator) {
          scrollIndicator.style.opacity = (progress >= chStart && progress <= chEnd) ? "1" : "0";
        }

        if (progress >= chStart && progress <= chEnd) {
          /* Cycle 8 photos across the entire gallery zone (100%) */
          var subProgress = (progress - chStart) / (chEnd - chStart);
          subProgress = Math.max(0, Math.min(1, subProgress));
          var photoIdx = Math.floor(subProgress * totalPhotos);
          photoIdx = Math.max(0, Math.min(totalPhotos - 1, photoIdx));
          goPhoto(photoIdx);

          /* Update persistent info from slide 2 project-info (only in gallery zone) */
          if (persistentInfo) {
            var slide2Info = slides[1].querySelector(".project-info");
            populateInfoFromSlide(slide2Info);
          }
        }
      }
    },
  });

  /* Jump to a specific slide from URL (?slide=X) */
  var slideParam = (new URLSearchParams(window.location.search)).get("slide");
  if (slideParam !== null) {
    var targetSlide = parseInt(slideParam, 10);
    if (isNaN(targetSlide) || targetSlide < 0 || targetSlide >= totalSlides) targetSlide = 0;

    window.addEventListener("load", function () {
      /* Scroll to top (native scroll) */
      window.scrollTo(0, 0);
      /* Force the track to the target slide */
      var targetProgress = targetSlide / (totalSlides - 1);
      var targetX = -targetProgress * (window.innerWidth * (totalSlides - 1));
      gsap.set(galleryTrack, { x: targetX });
      /* Pre-populate persistent info text */
      if (persistentInfo) {
        populateInfoFromSlide(slides[targetSlide]);
      }
    });
  }

  /* Update URL when user scrolls between slides */
  ScrollTrigger.create({
    trigger: worksSection,
    onUpdate: function (self) {
      var progress = self.progress;
      var currentSlide = Math.round(progress * (totalSlides - 1));
      currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide));
      var newUrl = window.location.pathname + "?slide=" + currentSlide;
      window.history.replaceState(null, "", newUrl);
    },
  });
})();

// ============================================================================
// Custom works cursor — red circle + "learn more" text (hidden on desktop)
// ============================================================================
(function () {
  var worksSection = document.getElementById("works");
  var cursor = document.querySelector(".works-cursor");
  if (!worksSection || !cursor) return;

  /* Hide cursor on touch devices */
  if ("ontouchstart" in window) {
    cursor.style.display = "none";
    return;
  }

  worksSection.addEventListener("mousemove", function (e) {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
    cursor.classList.add("visible");
  });

  worksSection.addEventListener("mouseleave", function () {
    cursor.classList.remove("visible");
  });
})();
