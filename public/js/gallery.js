(function () {
  var track = document.getElementById('gallery-track');
  var thumbs = document.querySelectorAll('.gallery-thumb');
  if (!track || !thumbs.length) return;

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var index = Number(thumb.dataset.index);
      var slide = track.children[index];
      if (slide) {
        track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      }
      thumbs.forEach(function (t) { t.classList.remove('border-terracotta'); });
      thumb.classList.add('border-terracotta');
    });
  });
})();
