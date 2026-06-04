# Chelsea Photo Gallery for Works Slide 2

## Goal
Transform slide 2 (currently a single full-bleed `img/about-bg.JPG`) into a scrollable photo gallery that showcases the 8 chelsea photos (`img/chelsea/DSC06571-Edit.jpg` through `DSC07072.jpg`). The gallery activates when the user's main horizontal scroll reaches slide 2, and they can browse the photos by continuing to scroll down the page (vertical scroll).

## Current Context
- Works section has 5 slides: pizza (video), about-bg (image), badasf (video), photography (image), web experience (image).
- The horizontal scroll uses GSAP ScrollTrigger: the entire section is pinned, and `gallery-track` moves left based on vertical scroll progress.
- Slide 2 is a `.gallery-slide` containing a single `.project-image` with `background-image: url('img/about-bg.JPG')`.
- All per-slide `.project-info` elements are hidden (`display: none`); a `.persistent-project-info` overlay at the bottom shows the active slide's title/number/description.
- The persistent info for slide 2 currently reads "02 / UI/UX Design / Mobile banking app redesign...".

## Proposed Approach — 2D Scroll (Nested Vertical Scroll Inside Slide 2)

Use the "2D scroll" pattern where the **first 80% of the page-scroll height that lands on slide 2 drives the horizontal scroll**, then a **secondary scroll zone** inside slide 2 consumes the **remaining scroll** to animate through the 8 chelsea photos via a GSAP timeline. When the user finishes the photos, scroll is released back to the main horizontal scroll.

This means:
1. The **first 80%** of the height that lands on slide 2 = horizontal scroll destination (slide 2 is in view).
2. The **remaining 20%** of the scroll height = secondary ScrollTrigger that runs a GSAP animation cycling through the 8 chelsea photos.
3. When the photo animation completes, the user's next scroll continues the main horizontal scroll to slide 3.

### How it works step by step:

**Scroll phase 1 (main horizontal scroll)**:
- The user scrolls down to bring slide 2 into view (slides 0 -> 1 -> 2).
- The main ScrollTrigger pin-and-move handles this, just like before.
- At this point, slide 2 is displayed with its original `.project-image` (`img/about-bg.JPG`) showing briefly, then it gets replaced by the photo gallery.

**Scroll phase 2 (nested photo gallery)**:
- A secondary `ScrollTrigger` is created for slide 2 with a duration shorter than the main section (e.g., `end: "+=" + (galleryDuration)`).
- This trigger is disabled when the main scroll is outside slide 2.
- Its `onUpdate` runs a GSAP timeline that cycles through the 8 chelsea photos — crossfading, vertical sliding, or a mosaic grid that assembles.

**Scroll phase 3 (release back to main)**:
- Once the photo animation completes, the secondary ScrollTrigger disables itself.
- The main horizontal scroll resumes, moving the user to slide 3.

## Files to Change

### 1. `index.html` — Replace slide 2 content

Replace the current slide 2 HTML (lines 145–152):

```html
<!-- Slide 2: Chelsea Photo Gallery -->
<div class="gallery-slide" id="slide2-gallery">
    <!-- Hidden background (original) */
    <div class="project-image" id="slide2-bg"
         style="background-image: url('img/about-bg.JPG');"></div>

    <!-- Photo overlay container (8 photos, stacked) */
    <div class="chelsea-gallery">
        <img src="img/chelsea/DSC06571-Edit.jpg" class="chelsea-photo active" alt="Chelsea 1"/>
        <img src="img/chelsea/DSC06651.jpg" class="chelsea-photo" alt="Chelsea 2"/>
        <img src="img/chelsea/DSC06774-Edit.jpg" class="chelsea-photo" alt="Chelsea 3"/>
        <img src="img/chelsea/DSC06822.jpg" class="chelsea-photo" alt="Chelsea 4"/>
        <img src="img/chelsea/DSC06848.jpg" class="chelsea-photo" alt="Chelsea 5"/>
        <img src="img/chelsea/DSC06936.jpg" class="chelsea-photo" alt="Chelsea 6"/>
        <img src="img/chelsea/DSC07038.jpg" class="chelsea-photo" alt="Chelsea 7"/>
        <img src="img/chelsea/DSC07072.jpg" class="chelsea-photo" alt="Chelsea 8"/>
    </div>

    <!-- Persistent info for this slide (moved from original) */
    <div class="project-info">
        <div class="project-number">02</div>
        <div class="project-title">Chelsea</div>
        <div class="project-desc">Documentary photography series.</div>
    </div>
</div>
```

Key changes:
- Rename slide 2 id to `slide2-gallery`
- Add a `.chelsea-gallery` container with 8 `<img>` elements, stacked absolutely with `opacity: 0` (only `.active` gets `opacity: 1`)
- Change the persistent info text to reflect "Chelsea" project (02 / Chelsea / Documentary photography series)

### 2. `css/styles.css` — New gallery CSS

Add new CSS rules (after line 325 or where `.gallery-slide` rules are):

```css
/* Chelsea gallery inside slide 2 */
.chelsea-gallery {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 1;
}

.chelsea-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: 0;
    transition: opacity 0.5s ease, transform 0.8s ease;
}

.chelsea-photo.active {
    opacity: 1;
    z-index: 1;
}

.chelsea-photo.transition {
    transform: scale(1.05);
}
```

Also: the persistent info overlay currently doesn't update for slide 2 (it stays on slide 0 data). After adding the chelsea content, the persistent info text (`.project-info` inside slide 2) needs to be read by the persistent overlay — this is handled by the existing `updatePersistentInfo` function since we're adding a `.project-info` block inside slide 2.

### 3. `jar/scripts.js` — Add secondary ScrollTrigger for photo gallery

Add a new IIFE after the existing works section block (after line 516):

```javascript
/* Slide 2: Nested vertical scroll → chelsea photo gallery */
(function () {
    var worksSection = document.getElementById('works');
    var slide2 = document.getElementById('slide2-gallery');
    if (!worksSection || !slide2) return;

    var photos = slide2.querySelectorAll('.chelsea-photo');
    if (photos.length === 0) return;
    var totalPhotos = photos.length;

    // Start with the first photo visible
    photos[0].classList.add('active');

    var trigger = null;
    var activeIndex = 0;

    function goToPhoto(index) {
        // Fade out current
        photos[activeIndex].classList.remove('active');
        photos[activeIndex].classList.add('transition');
        // Fade in next
        activeIndex = index;
        photos[activeIndex].classList.add('active');
    }

    function disableGallery() {
        if (trigger) { trigger.disable(); }
    }

    function enableGallery() {
        if (!trigger) {
            trigger = ScrollTrigger.create({
                trigger: worksSection,
                start: function () {
                    // Start when slide 2 is fully in view (progress 0.8 on a 5-slide layout)
                    return 'top top';
                },
                end: '+=1200',  // scroll distance to cycle through all photos
                pin: false,
                scrub: 0.3,
                disable: true,
                onEnter: function () {
                    trigger.enable();
                    disableGallery();  // prevent main horizontal move while active
                },
                onEnterBack: function () {
                    trigger.enable();
                    disableGallery();
                },
                onUpdate: function (self) {
                    var progress = self.progress;  // 0 → 1
                    var photoIndex = Math.min(
                        Math.floor(progress * totalPhotos),
                        totalPhotos - 1
                    );
                    if (photoIndex !== activeIndex) {
                        goToPhoto(photoIndex);
                    }
                    // Update persistent info to match slide 2 content
                    var slideInfo = slide2.querySelector('.project-info');
                    if (slideInfo && persistentInfo) {
                        var numEl = persistentInfo.querySelector('.project-number');
                        var ttlEl = persistentInfo.querySelector('.project-title');
                        var descEl = persistentInfo.querySelector('.project-desc');
                        var srcNum = slideInfo.querySelector('.project-number');
                        var srcTtl = slideInfo.querySelector('.project-title');
                        var srcDesc = slideInfo.querySelector('.project-desc');
                        if (numEl && srcNum) numEl.textContent = srcNum.textContent;
                        if (ttlEl && srcTtl) ttlEl.textContent = srcTtl.textContent;
                        if (descEl && srcDesc) descEl.textContent = srcDesc.textContent;
                    }
                },
                onLeaveBack: function () {
                    // When scrolling back, reverse through photos
                    var progress = self.progress;
                    var photoIndex = Math.min(
                        Math.floor(progress * totalPhotos),
                        totalPhotos - 1
                    );
                    if (photoIndex !== activeIndex) {
                        goToPhoto(photoIndex);
                    }
                },
                onLeave: function () {
                    disableGallery();
                    // Re-enable the main horizontal scroll by re-triggering it
                }
            });
        }
    }
})();
```

The key insight: the secondary ScrollTrigger's `onEnter` disables itself so the main horizontal scroll can resume once the photos are done. We use `disable: true` by default and enable it when the user enters slide 2, then disable it on `onLeave` so control passes back.

## Risks & Tradeoffs

1. **Scroll hijacking feels janky?** — The secondary ScrollTrigger must be careful to not conflict with the main horizontal scroll. Use `pin: false` (we don't want to re-pin) and rely on the `disable: true` toggle to hand control back and forth.

2. **Performance with 8 large photos** — 8 images averaging ~15MB each could cause memory pressure. Consider:
   - Preloading the first 3 images on page load
   - Lazy-loading the rest
   - Using CSS `object-fit: cover` to crop rather than scroll/pan (avoid showing full-resolution images)
   - Optionally resizing images for the gallery at build time

3. **Reverse scrolling** — When the user scrolls backward, the gallery must animate back through the photos in reverse. The `onEnterBack` and `onLeaveBack` callbacks handle this.

4. **Persistent info text** — Currently, the persistent info for slide 2 reads "02 / UI/UX Design." The plan is to update this to "02 / Chelsea / Documentary photography series" (the user can adjust the text to taste).

5. **First photo showing during horizontal scroll** — The original `.project-image` (`img/about-bg.JPG`) could act as a fallback/preview while the user is scrolling toward slide 2, then fade out as the gallery activates.

## Open Questions

1. Should the photos transition by crossfade, vertical pan, or side-slide? (crossfade is simplest, side-slide is more dynamic)
2. Should the title/description for the chelsea project match existing naming (number + title + description) or be bespoke?
3. Do you want the entire original `img/about-bg.JPG` replaced, or should it appear as a final "cover" image after the 8 chelsea photos?
4. How many photos do you want shown at once? (stacked = 1 visible at a time, side-by-side thumbnails = multiple)

## Verification Steps

1. Open the site in a browser.
2. Scroll down to the works section.
3. Scroll horizontally (via vertical page scroll) until you reach slide 2.
4. Continue scrolling — the 8 chelsea photos should cycle through.
5. After the last photo, the horizontal scroll should resume to slide 3 (badasf).
6. Scroll back up — the gallery should reverse.
7. Verify the persistent info overlay updates to "02 / Chelsea / Documentary photography series."
8. Check the works cursor (red circle + "learn more") still works correctly.
9. Verify no JS errors in the console.
