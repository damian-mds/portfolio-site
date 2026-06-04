// jar/scripts.js

// Lenis smooth scroll
(function () {
  try {
    if (typeof Lenis === "undefined") return;

    /* Vertical Lenis */
    var lenis = new Lenis({
      duration: 2.5,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      orientation: "vertical",
      smoothWheel: true,
    });

    lenis.on("scroll", function () {
      window.dispatchEvent(new Event("scroll"));

      /* Active section highlight */
      updateActiveLink();
    });

    /* Hover tracking */
    var hoveredLink = null;
    var links = document.querySelectorAll(".nav-links a");
    if (links.length === 0) return;

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var href = link.getAttribute("href");
        var target = document.querySelector(href);
        if (target) {
          lenis.scrollTo(target);
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

    /* Initial state */
    updateActiveLink();

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    window.lenis = lenis;
  } catch (err) {
    console.warn("Lenis init failed:", err);
  }
})();

/* Typewriter effect */
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

// Navbar scroll opacity and active section highlight
(function () {
  var nav = document.querySelector(".navbar");
  if (!nav) return;
  var threshold = 80;
  var links = nav.querySelectorAll(".nav-links a");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > threshold);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
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
    }
  });
})();

// Initialize typewriter and preload screen
window.addEventListener("load", function () {
  /* Typewriter */
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

  /* Preload screen */
  var preload = document.getElementById("preload-screen");
  var btnSound = document.getElementById("enter-sound");
  var btnNoSound = document.getElementById("enter-nosound");
  var bgVideo = document.querySelector(".bg-video");
  var navbars = document.querySelectorAll(".brandbar, .navbar");

  if (!preload) return;

  /* Set default volume */
  if (bgVideo) {
    bgVideo.volume = 0.05;
  }

  navbars.forEach(function (nav) {
    nav.style.visibility = "hidden";
  });
  document.body.style.overflow = "hidden";

  function enterSite(enableSound) {
    preload.classList.add("hidden");

    if (enableSound && bgVideo) {
      bgVideo.muted = false;
      bgVideo.play().catch(function () {});
      window._soundOn = true;
    } else if (bgVideo) {
      bgVideo.muted = true;
      window._soundOn = false;
    }

    navbars.forEach(function (nav) {
      nav.style.visibility = "visible";
    });
    document.body.style.overflow = "";

    /* Sync sound toggle icon */
    if (window._syncSoundIcon) window._syncSoundIcon();

    setTimeout(function () {
      preload.style.display = "none";
    }, 600);
  }

  if (btnSound) {
    btnSound.addEventListener("click", function () {
      enterSite(true);
    });
  }
  if (btnNoSound) {
    btnNoSound.addEventListener("click", function () {
      enterSite(false);
    });
  }
});

/* Sound toggle button */
(function () {
  var bgVideo = document.querySelector(".bg-video");
  var toggle = document.getElementById("sound-toggle");
  if (!toggle || !bgVideo) return;

  function updateIcon() {
    var soundOn = !bgVideo.muted;
    toggle.querySelector(".text-on").style.display = soundOn ? "block" : "none";
    toggle.querySelector(".text-off").style.display = soundOn ? "none" : "block";
    toggle.setAttribute("aria-label", soundOn ? "Mute sound" : "Play sound");
  }

  toggle.addEventListener("click", function () {
    bgVideo.muted = !bgVideo.muted;
    updateIcon();
    if (!bgVideo.muted) {
      bgVideo.play().catch(function () {});
    }
  });

  window._syncSoundIcon = updateIcon;
})();

// Navbar scroll opacity
(function () {
  var nav = document.querySelector(".navbar");
  if (!nav) return;
  var threshold = 80;

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > threshold);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();


// Auckland time widget
(function () {
  var $temp = document.getElementById("time-temp");
  var $desc = document.getElementById("time-desc");
  var $city = document.getElementById("time-city");

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
    if ($city) $city.textContent = "Auckland, NZ";
  }

  update();
  setInterval(update, 1000);
})();

/* About section scroll animation */
(function () {
  var aboutSection = document.getElementById("about");
  var paragraphs = document.querySelectorAll(".about-paragraph");
  if (!aboutSection || paragraphs.length === 0) return;

  var lines = aboutSection.querySelectorAll(".about-line");
  if (lines.length === 0) return;

  var lineCount = lines.length;
  var lineThreshold = 1 / lineCount;

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
  animateLines();
})();

/* Please-Scroll text change based on home section scroll progress */
(function () {
  var homeSection = document.getElementById("home");
  var pleaseScroll = document.querySelector(".please-scroll");
  if (!homeSection || !pleaseScroll || !window.lenis) return;

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

  window.lenis.on("scroll", checkScroll);
  checkScroll();
})();

/* Works section — horizontal gallery with GSAP ScrollTrigger */
(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  var worksSection = document.getElementById("works");
  var galleryTrack = document.querySelector(".gallery-track");
  var slides = document.querySelectorAll(".gallery-slide");
  var persistentInfo = document.querySelector(".persistent-project-info");
  if (!worksSection || !galleryTrack || slides.length === 0) return;

  /* Hide in-slide project-info for image slides during horizontal scroll (persistent takes over) — keep text visible for video slides */
  slides.forEach(function (slide) {
    var info = slide.querySelector(".project-info");
    var hasVideo = slide.querySelector(".project-video");
    if (info && !hasVideo) info.style.display = "none";
  });

  /* Populate persistent info with slide 0 data immediately */
  function populateInitialInfo() {
    var slide0 = slides[0].querySelector(".project-info");
    if (slide0 && persistentInfo) {
      var num = slide0.querySelector(".project-number");
      var ttl = slide0.querySelector(".project-title");
      var desc = slide0.querySelector(".project-desc");
      var numEl = persistentInfo.querySelector(".project-number");
      var ttlEl = persistentInfo.querySelector(".project-title");
      var descEl = persistentInfo.querySelector(".project-desc");
      if (numEl && num) numEl.textContent = num.textContent;
      if (ttlEl && ttl) ttlEl.textContent = ttl.textContent;
      if (descEl && desc) descEl.textContent = desc.textContent;
    }
  }

  /* Show persistent info when works section enters view (on page load / scroll into view) */
  var ppiClass = "works-visible";

  if (persistentInfo) {
    populateInitialInfo();
    persistentInfo.classList.add(ppiClass);

    /* Hide persistent info when works section is scrolled past vertically */
    ScrollTrigger.create({
      trigger: worksSection,
      start: "bottom top",
      end: "bottom+=200 top",
      onEnter: function () { persistentInfo.classList.remove(ppiClass); },
    });
  }

  var totalSlides = slides.length;

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
      var translateX = -progress * (window.innerWidth * (totalSlides - 1));
      gsap.set(galleryTrack, { x: translateX });

      /* Persistent info stays visible throughout horizontal scroll (not shown) */
      persistentInfo && persistentInfo.classList.add(ppiClass);

      /* Update persistent info text to match current slide */
      if (persistentInfo) {
        var currentSlide = Math.round(progress * (totalSlides - 1));
        currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide));
        var slideInfo = slides[currentSlide].querySelector(".project-info");
        if (slideInfo) {
          var num = slideInfo.querySelector(".project-number");
          var ttl = slideInfo.querySelector(".project-title");
          var desc = slideInfo.querySelector(".project-desc");
          var numEl = persistentInfo.querySelector(".project-number");
          var ttlEl = persistentInfo.querySelector(".project-title");
          var descEl = persistentInfo.querySelector(".project-desc");
          if (numEl && num) numEl.textContent = num.textContent;
          if (ttlEl && ttl) ttlEl.textContent = ttl.textContent;
          if (descEl && desc) descEl.textContent = desc.textContent;
        }
      }

      /* Grayscale/color per slide — image is color when slide is in view */
      for (var i = 0; i < totalSlides; i++) {
        var img = slides[i].querySelector(".project-image");
        if (img) {
          var slideCenter = i / (totalSlides - 1);
          var dist = Math.abs(progress - slideCenter);
          var colorStrength = Math.max(0, 1 - dist * 3);
          var saturation = Math.round(colorStrength * 100);
          var bright = (0.7 + colorStrength * 0.25).toFixed(2);
          img.style.filter = "grayscale(" + (100 - saturation) / 100 + ") brightness(" + bright + ")";
        }
      }
    },
  });
})();

/* Custom works cursor (red circle + "learn more") */
(function () {
  var worksSection = document.getElementById("works");
  var cursor = document.querySelector(".works-cursor");
  if (!worksSection || !cursor) return;

  worksSection.addEventListener("mousemove", function (e) {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
    cursor.classList.add("visible");
  });

  worksSection.addEventListener("mouseleave", function () {
    cursor.classList.remove("visible");
  });
})();
