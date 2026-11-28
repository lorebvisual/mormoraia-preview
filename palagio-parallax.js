function paintPalagioParallax(photoFrames, viewportHeight) {
  for (const frame of photoFrames) {
    const {top, bottom, height} = frame.getBoundingClientRect();
    if (bottom < 0 || top > viewportHeight || height === 0) continue;

    const progress = (viewportHeight - top) / (viewportHeight + height);
    // Match the image overscan so the frame stays filled throughout the movement.
    const drift = Math.min(36, height * .085);
    const offset = (progress * 2 - 1) * drift;
    frame.style.setProperty('--room-parallax', `${offset.toFixed(1)}px`);
  }
}
