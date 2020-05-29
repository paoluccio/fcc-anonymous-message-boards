function fadeIn(element) {
  element.style.display = 'block';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.classList.add('visible');
    })
  })
}

function fadeOut(element) {
  element.classList.remove('visible');
  setTimeout(() => element.style.display = 'none', 100);
}