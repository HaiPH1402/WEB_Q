/* =====================================================
   MAIN.JS — Bạc Tiên Silver Jewelry Store
   ===================================================== */

(function () {
  'use strict';

  /* ── STATE ── */
  let products = [];
  let cart = JSON.parse(localStorage.getItem('bactien_cart') || '[]');
  let currentFilter = 'all';

  /* ── DOM REFS ── */
  const productsGrid   = document.getElementById('productsGrid');
  const cartCount      = document.getElementById('cartCount');
  const cartSidebar    = document.getElementById('cartSidebar');
  const cartOverlay    = document.getElementById('cartOverlay');
  const cartItems      = document.getElementById('cartItems');
  const cartFooter     = document.getElementById('cartFooter');
  const cartTotalEl    = document.getElementById('cartTotal');
  const header         = document.getElementById('header');
  const backToTop      = document.getElementById('backToTop');
  const toast          = document.getElementById('toast');
  const modalOverlay   = document.getElementById('modalOverlay');
  const productModal   = document.getElementById('productModal');
  const modalContent   = document.getElementById('modalContent');
  const searchOverlay  = document.getElementById('searchOverlay');
  const searchInput    = document.getElementById('searchInput');
  const navLinks       = document.getElementById('navLinks');

  /* ══════════════════════════════════════════
     PRODUCTS — Fetch from products.json
  ══════════════════════════════════════════ */
  async function loadProducts() {
    try {
      const res  = await fetch('products.json?t=' + Date.now());
      products   = await res.json();
    } catch (e) {
      // Fallback: sample data if fetch fails (local dev)
      products = [
        { id:"1", name:"Nhẫn Bạc Hoa Hồng", price:350000, originalPrice:450000, category:"Nhẫn", description:"Nhẫn bạc 925 hình hoa hồng tinh xảo.", images:["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80"], badge:"Bán Chạy", rating:4.9, reviews:128, inStock:true },
        { id:"2", name:"Dây Chuyền Bạc Moon", price:520000, originalPrice:680000, category:"Dây Chuyền", description:"Dây chuyền bạc 925 mặt trăng lưỡi liềm.", images:["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80"], badge:"Mới", rating:4.8, reviews:89, inStock:true },
        { id:"3", name:"Vòng Tay Bạc Celtic", price:420000, originalPrice:420000, category:"Vòng Tay", description:"Vòng tay bạc 925 họa tiết Celtic.", images:["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80"], badge:"", rating:4.7, reviews:65, inStock:true },
        { id:"4", name:"Bông Tai Bạc Ngôi Sao", price:280000, originalPrice:320000, category:"Bông Tai", description:"Bông tai bạc 925 hình ngôi sao.", images:["https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80"], badge:"Sale", rating:4.6, reviews:42, inStock:true },
        { id:"5", name:"Lắc Chân Bạc Duyên Dáng", price:390000, originalPrice:480000, category:"Lắc Chân", description:"Lắc chân bạc 925 thiết kế nhẹ nhàng.", images:["https://images.unsplash.com/photo-1573408301185-9519f94aab18?w=600&q=80"], badge:"Hot", rating:4.8, reviews:97, inStock:true },
        { id:"6", name:"Mặt Dây Chuyền Bạc Tâm", price:460000, originalPrice:460000, category:"Dây Chuyền", description:"Mặt dây chuyền bạc 925 hình trái tim.", images:["https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80"], badge:"Mới", rating:5.0, reviews:34, inStock:true }
      ];
    }
    renderProducts(products);
  }

  /* ── RENDER PRODUCTS ── */
  function renderProducts(list) {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    if (!list.length) {
      productsGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:80px 24px;">
          <p style="font-size:3rem; opacity:.3">🔍</p>
          <p style="color:var(--text-muted); margin-top:16px">Không tìm thấy sản phẩm phù hợp</p>
        </div>`;
      return;
    }

    list.forEach(p => {
      const thumb = (p.images && p.images[0]) ? p.images[0] : 'https://via.placeholder.com/400x400?text=No+Image';
      const discount = p.originalPrice > p.price
        ? Math.round((1 - p.price / p.originalPrice) * 100)
        : 0;

      const card = document.createElement('div');
      card.className = 'product-card reveal';
      card.dataset.id = p.id;
      card.innerHTML = `
        <div class="product-img-wrap">
          <img src="${thumb}" alt="${p.name}" loading="lazy">
          ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
          <div class="product-actions">
            <button class="action-btn" title="Xem nhanh" data-quick="${p.id}">🔍</button>
            <button class="action-btn" title="Yêu thích">🤍</button>
          </div>
        </div>
        <div class="product-body">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-stars">
            <span class="stars-value">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
            <span style="color:var(--gold); font-weight:600; font-size:.85rem">${p.rating}</span>
            <span class="stars-count">(${p.reviews})</span>
          </div>
          <div class="product-price">
            <span class="price-current">${formatPrice(p.price)}</span>
            ${p.originalPrice > p.price ? `<span class="price-original">${formatPrice(p.originalPrice)}</span>` : ''}
            ${discount ? `<span class="product-badge" style="position:static; font-size:.7rem">-${discount}%</span>` : ''}
          </div>
          <button class="add-to-cart" data-add="${p.id}">🛒 Thêm Vào Giỏ</button>
        </div>`;

      productsGrid.appendChild(card);
    });

    // Observe for reveal animation
    observeReveal();
  }

  /* ── FILTER ── */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      const filtered = currentFilter === 'all'
        ? products
        : products.filter(p => p.category === currentFilter);
      renderProducts(filtered);
    });
  });

  /* Category cards also filter */
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.filter;
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === cat);
        });
        renderProducts(products.filter(p => p.category === cat));
      }, 600);
    });
  });

  /* ── PRODUCT DELEGATES ── */
  document.addEventListener('click', e => {
    const addBtn   = e.target.closest('[data-add]');
    const quickBtn = e.target.closest('[data-quick]');
    const pcardBtn = e.target.closest('.product-card');

    if (addBtn) {
      const p = products.find(p => p.id === addBtn.dataset.add);
      if (p) addToCart(p);
    } else if (quickBtn) {
      openModal(quickBtn.dataset.quick);
    } else if (pcardBtn && !e.target.closest('button')) {
      openModal(pcardBtn.dataset.id);
    }
  });

  /* ══════════════════════════════════════════
     CART
  ══════════════════════════════════════════ */
  function addToCart(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });
    saveCart();
    updateCartUI();
    showToast(`✓ Đã thêm "${product.name}" vào giỏ`);
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
    renderCartItems();
  }

  function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { removeFromCart(id); return; }
    saveCart();
    updateCartUI();
    renderCartItems();
  }

  function saveCart() {
    localStorage.setItem('bactien_cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    cartCount.textContent = total;
    cartCount.classList.toggle('show', total > 0);
  }

  function renderCartItems() {
    if (!cart.length) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <span>🛒</span>
          <p>Giỏ hàng trống</p>
          <a href="#products" class="btn-primary" id="startShop">Mua Sắm Ngay</a>
        </div>`;
      cartFooter.style.display = 'none';
      return;
    }

    cartFooter.style.display = 'block';
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    cartTotalEl.textContent = formatPrice(total);

    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.images?.[0] || ''}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="window._cartQty('${item.id}',-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="window._cartQty('${item.id}',1)">+</button>
            <button class="cart-item-remove" onclick="window._cartRemove('${item.id}')">Xóa</button>
          </div>
        </div>
      </div>`).join('');
  }

  window._cartQty    = (id, d) => changeQty(id, d);
  window._cartRemove = (id)    => removeFromCart(id);

  document.getElementById('cartBtn').addEventListener('click', () => {
    renderCartItems();
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('closeCart').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    showToast('💳 Đang kết nối cổng thanh toán...');
    closeCart();
  });

  /* ══════════════════════════════════════════
     PRODUCT MODAL
  ══════════════════════════════════════════ */
  function openModal(id) {
    const p = products.find(p => p.id == id);
    if (!p) return;
    const thumb = p.images?.[0] || 'https://via.placeholder.com/400';
    const discount = p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

    modalContent.innerHTML = `
      <div class="modal-inner">
        <div class="modal-gallery">
          <img src="${thumb}" alt="${p.name}">
        </div>
        <div class="modal-info">
          <div class="modal-category">${p.category}</div>
          <div class="modal-name">${p.name}</div>
          <div class="modal-stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))} ${p.rating} (${p.reviews} đánh giá)</div>
          <div class="modal-price">
            ${formatPrice(p.price)}
            ${p.originalPrice > p.price ? `<span style="font-size:.9rem; color:var(--text-muted); font-weight:400; text-decoration:line-through; margin-left:8px">${formatPrice(p.originalPrice)}</span>` : ''}
            ${discount ? `<span style="font-size:.8rem; background:var(--grad-gold); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-left:8px">-${discount}%</span>` : ''}
          </div>
          <p class="modal-desc">${p.description}</p>
          <div class="modal-actions">
            <button class="btn-primary btn-full" onclick="window._addCart('${p.id}')">🛒 Thêm Vào Giỏ Hàng</button>
            <button class="btn-ghost btn-full">💬 Tư Vấn Ngay</button>
          </div>
        </div>
      </div>`;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window._addCart = (id) => {
    const p = products.find(p => p.id == id);
    if (p) { addToCart(p); closeModal(); }
  };

  document.getElementById('modalClose').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════════════════
     SEARCH
  ══════════════════════════════════════════ */
  document.getElementById('searchBtn').addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
  });
  document.getElementById('closeSearch').addEventListener('click', () => {
    searchOverlay.classList.remove('active');
    searchInput.value = '';
  });

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) return;
      const found = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
      searchOverlay.classList.remove('active');
      searchInput.value = '';
      renderProducts(found);
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
      // Reset filter buttons
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
    }, 300);
  });

  /* ══════════════════════════════════════════
     SCROLL EFFECTS
  ══════════════════════════════════════════ */
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    header.classList.toggle('scrolled', scrollY > 60);
    backToTop.classList.toggle('show', scrollY > 400);
  });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── Intersection observer for reveal ── */
  function observeReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(el => {
        if (el.isIntersecting) { el.target.classList.add('visible'); io.unobserve(el.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  /* ══════════════════════════════════════════
     MOBILE MENU
  ══════════════════════════════════════════ */
  const menuToggle = document.getElementById('menuToggle');
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ══════════════════════════════════════════
     CONTACT FORM
  ══════════════════════════════════════════ */
  document.getElementById('contactForm')?.addEventListener('submit', e => {
    e.preventDefault();
    showToast('✉ Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi sớm.');
    e.target.reset();
  });

  /* ══════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════ */
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  /* ══════════════════════════════════════════
     UTILS
  ══════════════════════════════════════════ */
  function formatPrice(n) {
    return n.toLocaleString('vi-VN') + '₫';
  }

  /* ══════════════════════════════════════════
     REVEAL SECTIONS
  ══════════════════════════════════════════ */
  function setupRevealSections() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(el => {
        if (el.isIntersecting) { el.target.classList.add('visible'); io.unobserve(el.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.trust-item, .category-card, .testimonial-card, .contact-item').forEach(el => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  function init() {
    loadProducts();
    updateCartUI();
    setupRevealSections();
  }

  init();

})();
