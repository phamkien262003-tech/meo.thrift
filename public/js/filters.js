(function () {
  var toggleBtn = document.getElementById('filter-toggle');
  var form = document.getElementById('filter-form');
  if (toggleBtn && form) {
    toggleBtn.addEventListener('click', function () {
      form.classList.toggle('hidden');
    });
  }
})();
