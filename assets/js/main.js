(function () {
  'use strict';

  /* ========================================================================
     CONFIG — edite estes valores com os dados reais da loja
     ======================================================================== */
  var CONFIG = {
    // Número do WhatsApp da loja no formato internacional, só dígitos
    // (55 + DDD + número). Ex.: 5511987654321
    WHATSAPP_NUMBER: '5500000000000', // TODO: troque pelo WhatsApp real da Yus Beauty
    INSTAGRAM_URL: '#', // TODO: cole o link do Instagram da marca
  };

  document.getElementById('year').textContent = new Date().getFullYear();

  var waLink = 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER;
  var footerWa = document.getElementById('footerWhatsapp');
  if (footerWa) footerWa.href = waLink;
  var igLink = document.querySelector('.footer-col a[href="#"][target="_blank"]');
  if (igLink) igLink.href = CONFIG.INSTAGRAM_URL;

  /* ========================================================================
     Mobile menu
     ======================================================================== */
  var menuToggle = document.getElementById('menuToggle');
  var mainNav = document.getElementById('mainNav');
  menuToggle.addEventListener('click', function () {
    var isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
  mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mainNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ========================================================================
     Scroll reveal
     ======================================================================== */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ========================================================================
     Quantity steppers (product cards)
     ======================================================================== */
  document.querySelectorAll('.qty-stepper').forEach(function (stepper) {
    var valueEl = stepper.querySelector('.qty-value');
    stepper.querySelectorAll('.qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qty = parseInt(valueEl.textContent, 10);
        if (btn.dataset.action === 'inc') qty += 1;
        else qty = Math.max(1, qty - 1);
        valueEl.textContent = qty;
      });
    });
  });

  /* ========================================================================
     Cart state (persisted in localStorage)
     ======================================================================== */
  var CART_KEY = 'yusBeautyCart';
  var cart = loadCart();

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }

  function formatBRL(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function addToCart(id, name, price, qty) {
    var existing = cart.find(function (item) { return item.id === id; });
    if (existing) existing.qty += qty;
    else cart.push({ id: id, name: name, price: price, qty: qty });
    saveCart();
    renderCart();
    showToast(name + ' adicionado ao carrinho');
  }

  function updateQty(id, delta) {
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(function (i) { return i.id !== id; });
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter(function (i) { return i.id !== id; });
    saveCart();
    renderCart();
  }

  function cartTotal() {
    return cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
  }

  function cartCountTotal() {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  /* ------------------------------------------------------------------------
     Render
     ------------------------------------------------------------------------ */
  var cartItemsEl = document.getElementById('cartItems');
  var cartEmptyEl = document.getElementById('cartEmpty');
  var cartTotalEl = document.getElementById('cartTotal');
  var cartCountEl = document.getElementById('cartCount');
  var checkoutBtn = document.getElementById('checkoutBtn');

  function renderCart() {
    cartItemsEl.querySelectorAll('.cart-item').forEach(function (el) { el.remove(); });

    if (cart.length === 0) {
      cartEmptyEl.hidden = false;
      checkoutBtn.disabled = true;
    } else {
      cartEmptyEl.hidden = true;
      checkoutBtn.disabled = false;
      cart.forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML =
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + item.name + '</div>' +
            '<div class="cart-item-price">' + formatBRL(item.price) + ' cada</div>' +
            '<div class="cart-item-qty">' +
              '<button type="button" data-action="dec" aria-label="Diminuir">−</button>' +
              '<span>' + item.qty + '</span>' +
              '<button type="button" data-action="inc" aria-label="Aumentar">+</button>' +
              '<button type="button" class="cart-item-remove">remover</button>' +
            '</div>' +
          '</div>';
        row.querySelector('[data-action="dec"]').addEventListener('click', function () { updateQty(item.id, -1); });
        row.querySelector('[data-action="inc"]').addEventListener('click', function () { updateQty(item.id, 1); });
        row.querySelector('.cart-item-remove').addEventListener('click', function () { removeItem(item.id); });
        cartItemsEl.appendChild(row);
      });
    }

    cartTotalEl.textContent = formatBRL(cartTotal());
    var count = cartCountTotal();
    cartCountEl.hidden = count === 0;
    cartCountEl.textContent = count;
  }

  document.querySelectorAll('.add-to-cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.dataset.id;
      var name = btn.dataset.name;
      var price = parseFloat(btn.dataset.price);
      var stepper = document.querySelector('.qty-stepper[data-qty-for="' + id + '"]');
      var qty = stepper ? parseInt(stepper.querySelector('.qty-value').textContent, 10) : 1;
      addToCart(id, name, price, qty);
      openCart();
    });
  });

  /* ========================================================================
     Cart drawer open/close
     ======================================================================== */
  var cartDrawer = document.getElementById('cartDrawer');
  var drawerOverlay = document.getElementById('drawerOverlay');
  var cartToggle = document.getElementById('cartToggle');
  var cartClose = document.getElementById('cartClose');

  function openCart() {
    cartDrawer.classList.add('is-open');
    drawerOverlay.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('is-open');
    drawerOverlay.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  cartToggle.addEventListener('click', function () {
    cartDrawer.classList.contains('is-open') ? closeCart() : openCart();
  });
  cartClose.addEventListener('click', closeCart);
  drawerOverlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCart();
  });

  /* ========================================================================
     Checkout via WhatsApp
     ======================================================================== */
  checkoutBtn.addEventListener('click', function () {
    if (cart.length === 0) return;
    var lines = ['Olá! Gostaria de fazer o seguinte pedido na Yus Beauty:', ''];
    cart.forEach(function (item) {
      lines.push('• ' + item.qty + 'x ' + item.name + ' — ' + formatBRL(item.price * item.qty));
    });
    lines.push('');
    lines.push('Total: ' + formatBRL(cartTotal()));
    var message = encodeURIComponent(lines.join('\n'));
    window.open(waLink + '?text=' + message, '_blank', 'noopener');
  });

  /* ========================================================================
     Toast
     ======================================================================== */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  /* ========================================================================
     Header shadow on scroll (subtle)
     ======================================================================== */
  var header = document.getElementById('siteHeader');
  var lastScrolled = false;
  window.addEventListener('scroll', function () {
    var scrolled = window.scrollY > 8;
    if (scrolled !== lastScrolled) {
      header.style.boxShadow = scrolled ? '0 4px 20px rgba(46,18,51,0.08)' : 'none';
      lastScrolled = scrolled;
    }
  }, { passive: true });

  renderCart();
})();
