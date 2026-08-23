(function () {
  var CART_KEY = 'teomhrift_cart';
  var WISHLIST_KEY = 'teomhrift_wishlist';

  var TONE_GRADIENTS = {
    terracotta: 'linear-gradient(135deg,#E0A588,#C67B5C)',
    olive: 'linear-gradient(135deg,#8B9A5C,#6B7B3C)',
    rose: 'linear-gradient(135deg,#E8C7C7,#D4A5A5)',
    sand: 'linear-gradient(135deg,#F5EEDC,#EFE7D8)',
    clay: 'linear-gradient(135deg,#D8A17E,#B5651D)',
  };

  function readIds(key) {
    try {
      var raw = localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeIds(key, ids) {
    localStorage.setItem(key, JSON.stringify(ids));
  }

  function getCart() { return readIds(CART_KEY); }
  function getWishlist() { return readIds(WISHLIST_KEY); }

  function addToCart(id) {
    var ids = getCart();
    if (ids.indexOf(id) === -1) ids.push(id);
    writeIds(CART_KEY, ids);
    updateBadges();
  }

  function removeFromCart(id) {
    writeIds(CART_KEY, getCart().filter(function (x) { return x !== id; }));
    updateBadges();
  }

  function toggleWishlist(id) {
    var ids = getWishlist();
    var idx = ids.indexOf(id);
    if (idx === -1) ids.push(id); else ids.splice(idx, 1);
    writeIds(WISHLIST_KEY, ids);
    updateBadges();
    return idx === -1;
  }

  function clearCart() { localStorage.removeItem(CART_KEY); updateBadges(); }

  function updateBadges() {
    var cartCount = getCart().length;
    var wishCount = getWishlist().length;
    var cartEl = document.getElementById('cart-count');
    var wishEl = document.getElementById('wishlist-count');
    if (cartEl) {
      cartEl.textContent = String(cartCount);
      cartEl.classList.toggle('hidden', cartCount === 0);
    }
    if (wishEl) {
      wishEl.textContent = String(wishCount);
      wishEl.classList.toggle('hidden', wishCount === 0);
    }
    document.querySelectorAll('.wishlist-toggle, #toggle-wishlist').forEach(function (btn) {
      var id = Number(btn.dataset.productId);
      var active = getWishlist().indexOf(id) !== -1;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('text-terracotta', active);
    });
  }

  function fetchProducts(ids) {
    if (!ids.length) return Promise.resolve([]);
    return fetch('/api/gio-hang/thong-tin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { return data.items || []; });
  }

  function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + 'đ';
  }

  function mediaMarkup(item) {
    if (item.image_id) {
      return '<img src="/img/' + item.image_id + '" alt="" class="w-full h-full object-cover" />';
    }
    var tone = item.placeholder_tone || 'terracotta';
    return '<div class="w-full h-full" style="background:' + (TONE_GRADIENTS[tone] || TONE_GRADIENTS.terracotta) + '"></div>';
  }

  function renderCartPage() {
    var ids = getCart();
    var loading = document.getElementById('cart-loading');
    var empty = document.getElementById('cart-empty');
    var content = document.getElementById('cart-content');

    fetchProducts(ids).then(function (items) {
      loading.classList.add('hidden');
      if (items.length === 0) {
        empty.classList.remove('hidden');
        return;
      }
      content.classList.remove('hidden');
      var list = document.getElementById('cart-items');
      list.innerHTML = items
        .map(function (item) {
          var unavailable = item.status !== 'available';
          return (
            '<li class="card-surface p-4 flex gap-4 items-center">' +
            '<div class="w-16 h-20 rounded-lg overflow-hidden shrink-0">' + mediaMarkup(item) + '</div>' +
            '<div class="flex-1 min-w-0">' +
            '<a href="/san-pham/' + item.slug + '" class="font-serif text-lg hover:text-terracotta transition-colors duration-250 line-clamp-1">' + item.name + '</a>' +
            '<p class="text-xs text-espresso-soft">Size ' + item.size_label + '</p>' +
            (unavailable ? '<p class="text-xs text-terracotta mt-1">Sản phẩm này vừa được đặt bởi khách khác</p>' : '') +
            '<p class="text-terracotta font-medium mt-1">' + formatPrice(item.price) + '</p>' +
            '</div>' +
            '<button type="button" class="remove-item p-2 text-espresso-soft hover:text-red-600 transition-colors duration-250" data-id="' + item.id + '" aria-label="Xóa khỏi giỏ hàng">✕</button>' +
            '</li>'
          );
        })
        .join('');

      var available = items.filter(function (i) { return i.status === 'available'; });
      var subtotal = available.reduce(function (s, i) { return s + i.price; }, 0);
      document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
      document.getElementById('cart-item-count').textContent = available.length + ' sản phẩm';

      list.querySelectorAll('.remove-item').forEach(function (btn) {
        btn.addEventListener('click', function () {
          removeFromCart(Number(btn.dataset.id));
          renderCartPage();
        });
      });
    });
  }

  function renderWishlistPage() {
    var ids = getWishlist();
    var loading = document.getElementById('wishlist-loading');
    var empty = document.getElementById('wishlist-empty');
    var grid = document.getElementById('wishlist-grid');

    fetchProducts(ids).then(function (items) {
      loading.classList.add('hidden');
      if (items.length === 0) {
        empty.classList.remove('hidden');
        return;
      }
      grid.classList.remove('hidden');
      grid.innerHTML = items
        .map(function (item) {
          return (
            '<a href="/san-pham/' + item.slug + '" class="group">' +
            '<div class="aspect-[4/5] rounded-2xl overflow-hidden card-surface mb-3">' + mediaMarkup(item) + '</div>' +
            '<h3 class="font-serif text-lg group-hover:text-terracotta transition-colors duration-250 line-clamp-1">' + item.name + '</h3>' +
            '<p class="text-terracotta font-medium">' + formatPrice(item.price) + '</p>' +
            '</a>'
          );
        })
        .join('');
    });
  }

  function renderCheckoutPage() {
    var ids = getCart();
    var empty = document.getElementById('checkout-empty');
    var content = document.getElementById('checkout-content');

    fetchProducts(ids).then(function (items) {
      var available = items.filter(function (i) { return i.status === 'available'; });
      if (available.length === 0) {
        empty.classList.remove('hidden');
        return;
      }
      content.classList.remove('hidden');
      var list = document.getElementById('checkout-items');
      list.innerHTML = available
        .map(function (item) {
          return (
            '<li class="flex justify-between text-sm">' +
            '<span>' + item.name + ' <span class="text-espresso-soft">(' + item.size_label + ')</span></span>' +
            '<span class="text-terracotta">' + formatPrice(item.price) + '</span>' +
            '</li>'
          );
        })
        .join('');
      var subtotal = available.reduce(function (s, i) { return s + i.price; }, 0);
      document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
      document.getElementById('items-field').value = JSON.stringify(available.map(function (i) { return { id: i.id }; }));
    });
  }

  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('#add-to-cart');
    if (addBtn) {
      addToCart(Number(addBtn.dataset.productId));
      var originalHtml = addBtn.innerHTML;
      addBtn.textContent = 'Đã thêm vào giỏ ✓';
      setTimeout(function () {
        addBtn.innerHTML = originalHtml;
      }, 1500);
      return;
    }
    var wishBtn = e.target.closest('.wishlist-toggle, #toggle-wishlist');
    if (wishBtn) {
      toggleWishlist(Number(wishBtn.dataset.productId));
    }
  });

  updateBadges();

  window.TeoCart = {
    getCart: getCart,
    getWishlist: getWishlist,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    toggleWishlist: toggleWishlist,
    clearCart: clearCart,
    renderCartPage: renderCartPage,
    renderWishlistPage: renderWishlistPage,
    renderCheckoutPage: renderCheckoutPage,
  };
})();
