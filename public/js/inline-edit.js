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
        var btnRow = wrap.querySelector('.js-edit-btn-row');
        var img = wrap.querySelector('.js-edit-image-img');
        if (!img) {
          img = document.createElement('img');
          img.className = 'w-full h-full object-cover js-edit-image-img';
          img.alt = '';
          img.style.objectPosition = 'center center';
          wrap.insertBefore(img, btnRow || null);
        }
        img.src = data.src;
        var positionBtn = wrap.querySelector('.js-edit-position-btn');
        if (positionBtn) positionBtn.classList.remove('hidden');
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

  // ---------- Image position (free drag-to-crop, like a photo editor's fixed-frame crop) ----------

  // Accepts both "NN% NN%" (what this picker now saves) and CSS keywords (what the old
  // 9-point picker saved, and what every field still defaults to) so old values keep working.
  function parsePosition(str) {
    var KEYWORD_X = { left: 0, center: 50, right: 100 };
    var KEYWORD_Y = { top: 0, center: 50, bottom: 100 };
    var parts = (str || 'center center').trim().split(/\s+/);
    function val(token, table) {
      if (!token) return 50;
      if (token.indexOf('%') !== -1) {
        var n = parseFloat(token);
        return isNaN(n) ? 50 : Math.min(Math.max(n, 0), 100);
      }
      return table.hasOwnProperty(token) ? table[token] : 50;
    }
    return { x: val(parts[0], KEYWORD_X), y: val(parts[1], KEYWORD_Y) };
  }

  function openCropModal(wrap) {
    var img = wrap.querySelector('.js-edit-image-img');
    if (!img) return;

    var frameAspect = wrap.clientWidth / wrap.clientHeight;
    if (!isFinite(frameAspect) || frameAspect <= 0) frameAspect = 1;

    var maxW = Math.min(420, window.innerWidth - 48);
    var maxH = Math.min(520, window.innerHeight - 200);
    var frameW = maxW;
    var frameH = frameW / frameAspect;
    if (frameH > maxH) {
      frameH = maxH;
      frameW = frameH * frameAspect;
    }

    var overlay = document.createElement('div');
    overlay.className = 'js-crop-overlay';
    var panel = document.createElement('div');
    panel.className = 'js-crop-panel';
    panel.innerHTML =
      '<p class="js-crop-title">Kéo ảnh để chọn phần hiển thị</p>' +
      '<div class="js-crop-frame" style="width:' + frameW + 'px;height:' + frameH + 'px;">' +
      '<img class="js-crop-img" src="' + img.src + '" draggable="false" alt="" />' +
      '</div>' +
      '<div class="js-crop-actions">' +
      '<button type="button" class="js-crop-cancel">Hủy</button>' +
      '<button type="button" class="js-crop-save">Lưu vị trí</button>' +
      '</div>';
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var frame = panel.querySelector('.js-crop-frame');
    var cropImg = panel.querySelector('.js-crop-img');
    var saveBtn = panel.querySelector('.js-crop-save');
    var cancelBtn = panel.querySelector('.js-crop-cancel');
    var current = parsePosition(img.style.objectPosition);

    var state = { imgW: 0, imgH: 0, left: 0, top: 0, dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };

    function layoutImage() {
      var natW = cropImg.naturalWidth;
      var natH = cropImg.naturalHeight;
      if (!natW || !natH) return;
      var imgAspect = natW / natH;
      var w, h;
      if (imgAspect > frameAspect) {
        h = frameH;
        w = h * imgAspect;
      } else {
        w = frameW;
        h = w / imgAspect;
      }
      state.imgW = w;
      state.imgH = h;
      state.left = -(w - frameW) * (current.x / 100);
      state.top = -(h - frameH) * (current.y / 100);
      cropImg.style.width = w + 'px';
      cropImg.style.height = h + 'px';
      cropImg.style.left = state.left + 'px';
      cropImg.style.top = state.top + 'px';
    }

    if (cropImg.complete && cropImg.naturalWidth) {
      layoutImage();
    } else {
      cropImg.addEventListener('load', layoutImage);
    }

    function clamp(v, min, max) {
      return Math.min(Math.max(v, min), max);
    }

    function onPointerDown(e) {
      state.dragging = true;
      var point = e.touches ? e.touches[0] : e;
      state.startX = point.clientX;
      state.startY = point.clientY;
      state.startLeft = state.left;
      state.startTop = state.top;
      cropImg.classList.add('is-dragging');
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!state.dragging) return;
      if (e.cancelable) e.preventDefault();
      var point = e.touches ? e.touches[0] : e;
      var dx = point.clientX - state.startX;
      var dy = point.clientY - state.startY;
      var minLeft = Math.min(0, frameW - state.imgW);
      var minTop = Math.min(0, frameH - state.imgH);
      state.left = clamp(state.startLeft + dx, minLeft, 0);
      state.top = clamp(state.startTop + dy, minTop, 0);
      cropImg.style.left = state.left + 'px';
      cropImg.style.top = state.top + 'px';
    }

    function onPointerUp() {
      state.dragging = false;
      cropImg.classList.remove('is-dragging');
    }

    frame.addEventListener('mousedown', onPointerDown);
    frame.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    function cleanup() {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      document.body.style.overflow = '';
      overlay.remove();
    }

    cancelBtn.addEventListener('click', cleanup);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) cleanup();
    });

    saveBtn.addEventListener('click', function () {
      var rangeX = state.imgW - frameW;
      var rangeY = state.imgH - frameH;
      var posX = rangeX > 0 ? Math.round((-state.left / rangeX) * 100) : 50;
      var posY = rangeY > 0 ? Math.round((-state.top / rangeY) * 100) : 50;
      savePosition(wrap, posX + '% ' + posY + '%', saveBtn, cleanup);
    });
  }

  function savePosition(wrap, position, saveBtn, onDone) {
    var img = wrap.querySelector('.js-edit-image-img');
    var originalLabel = saveBtn.textContent;
    saveBtn.setAttribute('disabled', 'disabled');
    saveBtn.textContent = 'Đang lưu...';

    // Wraps declare where/what to POST via data attributes so this one picker works for
    // page-content images, product photos, and journal covers alike (see data-position-url).
    var url = wrap.dataset.positionUrl || '/admin/noi-dung/api/image-position';
    var payload = { position: position };
    if (wrap.dataset.positionPayload) {
      try {
        Object.assign(payload, JSON.parse(wrap.dataset.positionPayload));
      } catch (err) {
        /* malformed payload attribute — fall back to just { position } */
      }
    } else {
      payload.page = wrap.dataset.page;
      payload.key = wrap.dataset.positionKey;
    }

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('save_failed');
        if (img) img.style.objectPosition = position;
        showToast('Đã lưu vị trí');
        onDone();
      })
      .catch(function () {
        showToast('Lưu vị trí thất bại, vui lòng thử lại.', true);
        saveBtn.removeAttribute('disabled');
        saveBtn.textContent = originalLabel;
      });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.js-edit-position-btn');
    if (!btn) return;
    e.preventDefault();
    var wrap = btn.closest('.js-edit-image-wrap');
    if (!wrap) return;
    openCropModal(wrap);
  });
})();
