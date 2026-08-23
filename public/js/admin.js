(function () {
  var menuBtn = document.getElementById('admin-menu-btn');
  var menu = document.getElementById('admin-menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var isHidden = menu.classList.contains('hidden');
      menu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(isHidden));
    });
  }
})();
