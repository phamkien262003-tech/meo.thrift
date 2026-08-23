(function () {
  function showToast(message, isError) {
    var toast = document.getElementById('admin-edit-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-edit-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = isError ? '#b3261e' : '';
    toast.classList.add('is-visible');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 1800);
  }

  function insertLineBreak() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    range.deleteContents();
    var br = document.createElement('br');
    range.insertNode(br);
    range.setStartAfter(br);
    range.setEndAfter(br);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function startEditing(el) {
    el.dataset.originalText = el.innerText;
    el.setAttribute('contenteditable', 'true');
  }

  function finishEditing(el) {
    el.removeAttribute('contenteditable');
    var value = el.innerText.replace(/\r\n/g, '\n');
    var original = el.dataset.originalText != null ? el.dataset.originalText : '';
    if (value === original) return;

    fetch('/admin/noi-dung/api/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ page: el.dataset.page, key: el.dataset.key, value: value }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('save_failed');
        return res.json();
      })
      .then(function () {
        el.classList.remove('js-edit-flash-saved');
        void el.offsetWidth;
        el.classList.add('js-edit-flash-saved');
        showToast('Đã lưu');
      })
      .catch(function () {
        el.innerText = original;
        showToast('Lưu thất bại, đã khôi phục nội dung cũ.', true);
      });
  }

  document.addEventListener('mousedown', function (e) {
    var el = e.target.closest && e.target.closest('.js-edit-text');
    if (el && el.getAttribute('contenteditable') !== 'true') {
      startEditing(el);
    }
  });

  document.addEventListener('click', function (e) {
    var editEl = e.target.closest && e.target.closest('.js-edit-text');
    if (editEl) {
      // Stop <summary> toggling, <a> navigation, <button type=submit>, etc. while editing.
      e.preventDefault();
    }
  });

  document.addEventListener(
    'focusout',
    function (e) {
      var el = e.target.closest && e.target.closest('.js-edit-text');
      if (el && el.getAttribute('contenteditable') === 'true') {
        finishEditing(el);
      }
    },
    true
  );

  document.addEventListener('keydown', function (e) {
    var el = e.target.closest && e.target.closest('.js-edit-text');
    if (!el || el.getAttribute('contenteditable') !== 'true') return;

    if (e.key === 'Escape') {
      e.preventDefault();
      el.innerText = el.dataset.originalText || '';
      el.blur();
    } else if (e.key === 'Enter') {
      if (el.dataset.multiline === '1') {
        e.preventDefault();
        insertLineBreak();
      } else {
        e.preventDefault();
        el.blur();
      }
    }
  });

  // ---------- Images ----------

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.js-edit-image-btn');
    if (!btn) return;
    e.preventDefault();
    var wrap = btn.closest('.js-edit-image-wrap');
    if (!wrap || btn.hasAttribute('disabled')) return;

    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (file) uploadImage(wrap, btn, file);
    });
    input.click();
  });

  function uploadImage(wrap, btn, file) {
    var originalLabel = btn.innerHTML;
    btn.setAttribute('disabled', 'disabled');
    btn.textContent = 'Đang tải lên...';

    var fd = new FormData();
    fd.append('image', file);
    fd.append('page', wrap.dataset.page);
    fd.append('key', wrap.dataset.key);

    fetch('/admin/noi-dung/api/image', { method: 'POST', credentials: 'same-origin', body: fd })
      .then(function (res) {
        if (!res.ok) throw new Error('upload_failed');
        return res.json();
      })
      .then(function (data) {
        var existingSvg = wrap.querySelector('svg');
        if (existingSvg) existingSvg.remove();
        var img = wrap.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          img.className = 'w-full h-full object-cover';
          img.alt = '';
          wrap.insertBefore(img, btn);
        }
        img.src = data.src;
        showToast('Đã cập nhật ảnh');
      })
      .catch(function () {
        showToast('Tải ảnh thất bại, vui lòng thử lại.', true);
      })
      .finally(function () {
        btn.removeAttribute('disabled');
        btn.innerHTML = originalLabel;
      });
  }
})();
