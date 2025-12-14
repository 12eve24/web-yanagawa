// JavaScript: synchronize a fixed bottom scrollbar with the image row

// Smooth scroll helper function
function smoothScrollElement(element, distance, duration = 300) {
  const startScroll = element.scrollLeft;
  const targetScroll = startScroll + distance;
  const startTime = performance.now();

  function animateScroll(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Easing function for smooth motion
    const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    element.scrollLeft = startScroll + distance * easeProgress;

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }

  requestAnimationFrame(animateScroll);
}

const imageRow = document.getElementById('image-row');
const proxy = document.getElementById('scrollbar-proxy');
const proxyInner = document.getElementById('scrollbar-inner');

if (imageRow && proxy && proxyInner) {
  // set proxy inner width to match the scrollable content width
  function updateProxyWidth() {
    proxyInner.style.width = imageRow.scrollWidth + 'px';
  }

  // sync flags to avoid feedback loops
  let syncingFromImage = false;
  let syncingFromProxy = false;

  imageRow.addEventListener('scroll', () => {
    if (syncingFromProxy) return;
    syncingFromImage = true;
    proxy.scrollLeft = imageRow.scrollLeft;
    syncingFromImage = false;
  }, { passive: true });

  proxy.addEventListener('scroll', () => {
    if (syncingFromImage) return;
    syncingFromProxy = true;
    imageRow.scrollLeft = proxy.scrollLeft;
    syncingFromProxy = false;
  }, { passive: true });

  // when images load or window resizes, update the proxy width
  function onResizeOrLoad() {
    updateProxyWidth();
    proxy.scrollLeft = imageRow.scrollLeft;
  }

  window.addEventListener('resize', onResizeOrLoad);
  window.addEventListener('load', onResizeOrLoad);

  // also update when each image finishes loading
  const imgs = imageRow.querySelectorAll('img');
  imgs.forEach(img => img.addEventListener('load', updateProxyWidth));

  // allow mouse wheel (vertical) to scroll horizontally on imageRow with smooth animation
  imageRow.addEventListener('wheel', (e) => {
    // if horizontal wheel already present, don't interfere
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    smoothScrollElement(imageRow, e.deltaY, 200);
  }, { passive: false });

  // --- global wheel handler: convert vertical wheel anywhere on the page
  // into horizontal scrolling of the imageRow when appropriate.
  // This allows users to scroll images with the mouse wheel even when
  // the pointer is not hovering the image row or the bottom proxy.
  document.addEventListener('wheel', (e) => {
    // ignore if event is primarily horizontal
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    // if the event target is inside the image row or proxy, let their
    // specific handlers handle it (avoid double-handling)
    if (e.target.closest && (e.target.closest('.image-row') || e.target.closest('.scrollbar-proxy'))) {
      return;
    }

    // only convert if the imageRow actually has horizontal overflow
    if (imageRow.scrollWidth <= imageRow.clientWidth) return;

    // prevent page vertical scrolling and map vertical delta to horizontal
    e.preventDefault();
    smoothScrollElement(imageRow, e.deltaY, 200);
  }, { passive: false });

  // initial setup
  updateProxyWidth();
}

// --- Top row (img27): synchronize scroll with main row and align positions ---
const imageRowTop = document.getElementById('image-row-top');

if (imageRow && imageRowTop) {
  let syncingToTop = false;
  let syncingFromTop = false;

  // Synchronize scroll between main row and top row
  imageRow.addEventListener('scroll', () => {
    if (syncingFromTop) return;
    syncingToTop = true;
    const scrollRatio = imageRow.scrollLeft / (imageRow.scrollWidth - imageRow.clientWidth);
    const maxScrollTop = imageRowTop.scrollWidth - imageRowTop.clientWidth;
    imageRowTop.scrollLeft = scrollRatio * maxScrollTop;
    syncingToTop = false;
  }, { passive: true });

  imageRowTop.addEventListener('scroll', () => {
    if (syncingToTop) return;
    syncingFromTop = true;
    const scrollRatio = imageRowTop.scrollLeft / (imageRowTop.scrollWidth - imageRowTop.clientWidth);
    const maxScrollMain = imageRow.scrollWidth - imageRow.clientWidth;
    imageRow.scrollLeft = scrollRatio * maxScrollMain;
    syncingFromTop = false;
  }, { passive: true });

  // Adjust gap to align first/last images and distribute evenly
  function alignImageRows() {
    const mainImages = imageRow.querySelectorAll('img');
    const topImages = imageRowTop.querySelectorAll('img');
    
    if (mainImages.length === 0 || topImages.length === 0) return;

    // Wait for images to load
    const allImages = [...mainImages, ...topImages];
    Promise.all(allImages.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => img.addEventListener('load', resolve));
    })).then(() => {
      // Get the bounding rect of first and last main images
      const firstMain = mainImages[0];
      const lastMain = mainImages[mainImages.length - 1];
      
      const firstMainRect = firstMain.getBoundingClientRect();
      const lastMainRect = lastMain.getBoundingClientRect();
      
      // Total span from start of first to end of last image in main row
      const mainSpan = lastMainRect.right - firstMainRect.left;
      
      // Calculate total width of top images
      let topImagesWidth = 0;
      topImages.forEach(img => {
        topImagesWidth += img.offsetWidth;
      });
      
      // Calculate gap to fit all images in the same span
      const topImageCount = topImages.length;
      const totalGap = mainSpan - topImagesWidth;
      const gapPerImage = totalGap / (topImageCount - 1);
      
      imageRowTop.style.gap = Math.max(0, gapPerImage) + 'px';
    });
  }

  // Align on load and resize
  window.addEventListener('load', alignImageRows);
  window.addEventListener('resize', alignImageRows);
  setTimeout(alignImageRows, 100);
}

// --- Add click event to img1.png to open YouTube link ---
const img1 = document.querySelector('img[src="img/img1.png"]');
if (img1) {
  img1.style.cursor = 'pointer';
  img1.addEventListener('click', () => {
    window.open('https://youtu.be/8HgRa3zzOAE?si=waZL4IU_nM6SUMaf', '_blank');
  });
}

// --- Second row: synchronize with unified scrollbar proxy (synchronized with image-row) ---
const imageRowSecond = document.getElementById('image-row-second');
const proxySecond = document.getElementById('scrollbar-proxy-second');
const proxyInnerSecond = document.getElementById('scrollbar-inner-second');

if (imageRowSecond && proxySecond && proxyInnerSecond) {
  // Calculate total scrollable width considering both rows should end at the same time
  function updateUnifiedProxyWidth() {
    // Width needed for image-row
    const imageRowMaxScroll = imageRow.scrollWidth - imageRow.clientWidth;
    // Width needed for image-row-second
    const imageRowSecondMaxScroll = imageRowSecond.scrollWidth - imageRowSecond.clientWidth;
    
    // Use the larger of the two to make the proxy inner element
    const maxScroll = Math.max(imageRowMaxScroll, imageRowSecondMaxScroll);
    proxyInnerSecond.style.width = maxScroll + 'px';
  }

  let syncingFromImageSecond = false;
  let syncingFromProxySecond = false;
  let syncingToProxySecond = false;

  // When imageRowSecond scrolls, update the proxy with adjusted speed
  imageRowSecond.addEventListener('scroll', () => {
    if (syncingFromProxySecond) return;
    syncingToProxySecond = true;
    
    const imageRowMaxScroll = imageRow.scrollWidth - imageRow.clientWidth;
    const imageRowSecondMaxScroll = imageRowSecond.scrollWidth - imageRowSecond.clientWidth;
    
    if (imageRowSecondMaxScroll > 0) {
      // Slower speed: map imageRowSecond scroll ratio to imageRowMaxScroll scale
      const scrollRatio = imageRowSecond.scrollLeft / imageRowSecondMaxScroll;
      proxySecond.scrollLeft = scrollRatio * imageRowMaxScroll;
    }
    
    syncingToProxySecond = false;
  }, { passive: true });

  // When main imageRow scrolls, update both proxies and imageRowSecond
  imageRow.addEventListener('scroll', () => {
    const imageRowMaxScroll = imageRow.scrollWidth - imageRow.clientWidth;
    const imageRowSecondMaxScroll = imageRowSecond.scrollWidth - imageRowSecond.clientWidth;
    
    if (imageRowSecondMaxScroll > 0) {
      // Slower speed for second row: use scroll ratio to calculate slower position
      const scrollRatio = imageRow.scrollLeft / imageRowMaxScroll;
      imageRowSecond.scrollLeft = scrollRatio * imageRowSecondMaxScroll;
    }
  }, { passive: true });

  proxySecond.addEventListener('scroll', () => {
    if (syncingToProxySecond) return;
    syncingFromProxySecond = true;
    
    const imageRowMaxScroll = imageRow.scrollWidth - imageRow.clientWidth;
    const scrollRatio = proxySecond.scrollLeft / imageRowMaxScroll;
    
    imageRow.scrollLeft = scrollRatio * imageRowMaxScroll;
    
    syncingFromProxySecond = false;
  }, { passive: true });

  function onResizeOrLoadSecond() {
    updateUnifiedProxyWidth();
  }

  window.addEventListener('resize', onResizeOrLoadSecond);
  window.addEventListener('load', onResizeOrLoadSecond);

  const imgsSecond = imageRowSecond.querySelectorAll('img');
  imgsSecond.forEach(img => img.addEventListener('load', updateUnifiedProxyWidth));

  imageRowSecond.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    smoothScrollElement(imageRowSecond, e.deltaY, 200);
  }, { passive: false });

  updateUnifiedProxyWidth();

  // Add click handler for img21 in the second row
  const img21 = imageRowSecond.querySelector('img[alt="img21"]');
  if (img21) {
    img21.style.cursor = 'pointer';
    img21.addEventListener('click', () => {
      openLightbox('img/img21-1.png');
    });
  }

  const img22 = imageRowSecond.querySelector('img[alt="img22"]');
  if (img22) {
    img22.style.cursor = 'pointer';
    img22.addEventListener('click', () => {
      openLightbox('img/img22-1.png');
    });
  }

  const img23 = imageRowSecond.querySelector('img[alt="img23"]');
  const img24 = imageRowSecond.querySelector('img[alt="img24"]');

  if (img23) {
    img23.style.cursor = 'pointer';
    img23.addEventListener('click', () => {
      openLightbox('img/img23-1.png');
    });
    // Add hover effect that applies to both img23 and img24
    img23.addEventListener('mouseenter', () => {
      img23.classList.add('hovered-group');
      if (img24) img24.classList.add('hovered-group');
    });
    img23.addEventListener('mouseleave', () => {
      img23.classList.remove('hovered-group');
      if (img24) img24.classList.remove('hovered-group');
    });
  }

  if (img24) {
    img24.style.cursor = 'pointer';
    img24.addEventListener('click', () => {
      openLightbox('img/img23-1.png');
    });
    // Add hover effect that applies to both img23 and img24
    img24.addEventListener('mouseenter', () => {
      if (img23) img23.classList.add('hovered-group');
      img24.classList.add('hovered-group');
    });
    img24.addEventListener('mouseleave', () => {
      if (img23) img23.classList.remove('hovered-group');
      img24.classList.remove('hovered-group');
    });
  }

  const img25 = imageRowSecond.querySelector('img[alt="img25"]');
  if (img25) {
    img25.style.cursor = 'pointer';
    img25.addEventListener('click', () => {
      openLightbox('img/img25-1.png');
    });
  }

  const img26 = imageRowSecond.querySelector('img[alt="img26"]');
  if (img26) {
    img26.style.cursor = 'pointer';
    img26.addEventListener('click', () => {
      openLightbox('img/img26-1.png');
    });
  }
}

// --- Lightbox behavior for img1 -> show img1-1 overlay at 80% with back button
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxBackdrop = document.getElementById('lightbox-backdrop');

function openLightbox(src) {
  if (!lightbox) return;
  lightboxImg.src = src;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImg.src = '';
  document.body.style.overflow = '';
}

if (imageRow) {
  const img2 = imageRow.querySelector('img[alt="img2"]');
  if (img2) {
    img2.style.cursor = 'pointer';
    img2.addEventListener('click', () => {
      openLightbox('img/img2-1.png');
    });
  }

  const img3 = imageRow.querySelector('img[alt="img3"]');
  if (img3) {
    img3.style.cursor = 'pointer';
    img3.addEventListener('click', () => {
      openLightbox('img/img3-1.png');
    });
  }

  const img4 = imageRow.querySelector('img[alt="img4"]');
  if (img4) {
    img4.style.cursor = 'pointer';
    img4.addEventListener('click', () => {
      openLightbox('img/img4-1.png');
    });
  }

  const img5 = imageRow.querySelector('img[alt="img5"]');
  if (img5) {
    img5.style.cursor = 'pointer';
    img5.addEventListener('click', () => {
      openLightbox('img/img5-1.png');
    });
  }

  const img6 = imageRow.querySelector('img[alt="img6"]');
  if (img6) {
    img6.style.cursor = 'pointer';
    img6.addEventListener('click', () => {
      openLightbox('img/img6-1.png');
    });
  }

  const img7 = imageRow.querySelector('img[alt="img7"]');
  if (img7) {
    img7.style.cursor = 'pointer';
    img7.addEventListener('click', () => {
      openLightbox('img/img7-1.png');
    });
  }

  const img8 = imageRow.querySelector('img[alt="img8"]');
  if (img8) {
    img8.style.cursor = 'pointer';
    img8.addEventListener('click', () => {
      openLightbox('img/img8-1.png');
    });
  }

  const img9 = imageRow.querySelector('img[alt="img9"]');
  if (img9) {
    img9.style.cursor = 'pointer';
    img9.addEventListener('click', () => {
      openLightbox('img/img9-1.png');
    });
  }

  const img10 = imageRow.querySelector('img[alt="img10"]');
  if (img10) {
    img10.style.cursor = 'pointer';
    img10.addEventListener('click', () => {
      openLightbox('img/img10-1.png');
    });
  }

  const img11 = imageRow.querySelector('img[alt="img11"]');
  if (img11) {
    img11.style.cursor = 'pointer';
    img11.addEventListener('click', () => {
      openLightbox('img/img11-1.png');
    });
  }

  const img12 = imageRow.querySelector('img[alt="img12"]');
  if (img12) {
    img12.style.cursor = 'pointer';
    img12.addEventListener('click', () => {
      openLightbox('img/img12-1.png');
    });
  }

  const img13 = imageRow.querySelector('img[alt="img13"]');
  if (img13) {
    img13.style.cursor = 'pointer';
    img13.addEventListener('click', () => {
      openLightbox('img/img13-1.png');
    });
  }

  const img14 = imageRow.querySelector('img[alt="img14"]');
  if (img14) {
    img14.style.cursor = 'pointer';
    img14.addEventListener('click', () => {
      openLightbox('img/img14-1.png');
    });
  }

  const img15 = imageRow.querySelector('img[alt="img15"]');
  if (img15) {
    img15.style.cursor = 'pointer';
    img15.addEventListener('click', () => {
      openLightbox('img/img15-1.png');
    });
  }

  const img16 = imageRow.querySelector('img[alt="img16"]');
  if (img16) {
    img16.style.cursor = 'pointer';
    img16.addEventListener('click', () => {
      openLightbox('img/img16-1.png');
    });
  }

  const img17 = imageRow.querySelector('img[alt="img17"]');
  if (img17) {
    img17.style.cursor = 'pointer';
    img17.addEventListener('click', () => {
      openLightbox('img/img17-1.png');
    });
  }

  const img18 = imageRow.querySelector('img[alt="img18"]');
  if (img18) {
    img18.style.cursor = 'pointer';
    img18.addEventListener('click', () => {
      openLightbox('img/img18-1.png');
    });
  }

  const img19 = imageRow.querySelector('img[alt="img19"]');
  if (img19) {
    img19.style.cursor = 'pointer';
    img19.addEventListener('click', () => {
      openLightbox('img/img19-1.png');
    });
  }

  const img20 = imageRow.querySelector('img[alt="img20"]');
  if (img20) {
    img20.style.cursor = 'pointer';
    img20.addEventListener('click', () => {
      openLightbox('img/img20-1.png');
    });
  }

  const img21 = imageRowSecond.querySelector('img[alt="img21"]');
  if (img21) {
    img21.style.cursor = 'pointer';
    img21.addEventListener('click', () => {
      openLightbox('img/img21-1.png');
    });
  }
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
// also close on Escape
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });