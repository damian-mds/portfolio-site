/* Scroll animations: cards fade/slide in */
(function () {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    var cards = document.querySelectorAll(".work-card");
    cards.forEach(function (card, i) {
        gsap.from(card, {
            y: 60,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
            },
            delay: i * 0.1,
        });
    });

    /* Hero fade in */
    var hero = document.querySelector(".works-hero");
    if (hero) {
        gsap.from(hero.querySelector(".works-title"), {
            y: 30,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
        });
        gsap.from(hero.querySelector(".works-subtitle"), {
            y: 20,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            delay: 0.2,
        });
    }
})();
