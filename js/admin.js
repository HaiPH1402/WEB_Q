/* =====================================================
   ADMIN.JS — Bạc Tiên Silver Jewelry
   Không cần server — dùng GitHub API để lưu dữ liệu
   ===================================================== */

(function () {
  'use strict';

  /* ══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════ */
  let products     = [];
  let editingId    = null;
  let pendingImages = [];   // { url: string, isFile: bool, dataUrl?: string }
  let deleteTargetId = null;

  // Pagination
  const PER_PAGE = 8;
  let currentPage = 1;
  let filteredProducts = [];

  /* ══════════════════════════════════════════
     STORAGE KEYS
  ══════════════════════════════════════════ */
  const KEYS = {
    products: 'bactien_products',
    ghUser:   'bactien_gh_user',
    ghRepo:   'bactien_gh_repo',
    ghBranch: 'bactien_gh_branch',
    ghPath:   'bactien_gh_path',
    ghToken:  'bactien_gh_token',
  };

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  function init() {
    loadProducts();
    loadGithubConfig();
    setupNavigation();
    setupSearch();
    setupForm();
    setupDragDrop();
    renderAll();
  }

  /* ══════════════════════════════════════════
     LOAD / SAVE PRODUCTS
  ══════════════════════════════════════════ */
  function loadProducts() {
    const raw = localStorage.getItem(KEYS.products);
    if (raw) {
      try { products = JSON.parse(raw); } catch(e) { products = []; }
    } else {
      // Try to fetch products.json as initial data
      fetch('products.json?t=' + Date.now())
        .then(r => r.json())
        .then(data => {
          products = data;
          saveProductsLocal();
          renderAll();
        })
        .catch(() => { products = []; });
    }
  }

  function saveProductsLocal() {
    localStorage.setItem(KEYS.products, JSON.stringify(products));
  }

  /* ══════════════════════════════════════════
     RENDER ALL
  ══════════════════════════════════════════ */
  function renderAll() {
    renderDashboard();
    renderProductsTable();
  }

  /* ── DASHBOARD ── */
  function renderDashboard() {
    const cats = [...new Set(products.map(p => p.category))];
    const imgs = products.reduce((s, p) => s + (p.images?.length || 0), 0);
    const instock = products.filter(p => p.inStock !== false).length;

    setEl('stat-products',    products.length);
    setEl('stat-categories',  cats.length);
    setEl('stat-instock',     instock);
    setEl('stat-images',      imgs);
    setEl('productCountBadge', products.length);

    // Recent 5
    const tbody = document.getElementById('recentProductsTbody');
    if (!tbody) return;
    const recent = [...products].slice(-5).reverse();
    tbody.innerHTML = recent.map(p => productRow(p)).join('');
    updateGithubStatusDash();
  }

  function updateGithubStatusDash() {
    const cfg = getGithubConfig();
    const el = document.getElementById('githubStatusDash');
    if (!el) return;
    if (cfg.user && cfg.repo && cfg.token) {
      el.innerHTML = `<div class="status-dot green"></div><span>Đã cấu hình — <strong style="color:var(--gold)">${cfg.user}/${cfg.repo}</strong></span>`;
    } else {
      el.innerHTML = `<div class="status-dot yellow"></div><span>Chưa cấu hình — <a href="#" onclick="switchPage('github')" style="color:var(--gold)">Cấu hình ngay</a></span>`;
    }
  }

  /* ── PRODUCTS TABLE ── */
  function renderProductsTable(searchTerm = '', category = '') {
    filteredProducts = products.filter(p => {
      const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat    = !category   || p.category === category;
      return matchSearch && matchCat;
    });

    const tbody    = document.getElementById('productsTbody');
    const noEl     = document.getElementById('noProducts');
    const pagEl    = document.getElementById('pagination');
    if (!tbody) return;

    const totalPages = Math.ceil(filteredProducts.length / PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = 1;

    const slice = filteredProducts.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

    if (!filteredProducts.length) {
      tbody.innerHTML = '';
      noEl.style.display = 'block';
      pagEl.innerHTML = '';
      return;
    }
    noEl.style.display = 'none';
    tbody.innerHTML = slice.map(p => productRow(p)).join('');

    // Pagination
    let pag = '';
    for (let i = 1; i <= totalPages; i++) {
      pag += `<button class="page-btn${i===currentPage?' active':''}" onclick="goPage(${i})">${i}</button>`;
    }
    pagEl.innerHTML = pag;
  }

  function productRow(p) {
    const thumb = p.images?.[0] || '';
    const price = formatPrice(p.price);
    const origPrice = p.originalPrice ? formatPrice(p.originalPrice) : '—';
    const inStock = p.inStock !== false;
    return `
      <tr>
        <td>
          <div class="product-cell">
            ${thumb ? `<img class="product-thumb" src="${thumb}" alt="${p.name}" onerror="this.style.display='none'">` : `<div class="product-thumb" style="background:var(--dark-3);display:flex;align-items:center;justify-content:center">💍</div>`}
            <div class="product-cell-info">
              <div class="product-name">${p.name}</div>
              ${p.badge ? `<div class="product-cat">${p.badge}</div>` : ''}
            </div>
          </div>
        </td>
        <td><span class="badge badge-gold">${p.category}</span></td>
        <td style="color:var(--gold); font-weight:600">${price}</td>
        <td style="color:var(--text-muted)">${origPrice}</td>
        <td><span class="badge badge-blue">${p.images?.length || 0} ảnh</span></td>
        <td><span class="badge ${inStock?'badge-green':'badge-red'}">${inStock?'Còn Hàng':'Hết Hàng'}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:4px">
            <span style="color:var(--gold)">★</span>
            <span style="font-size:.85rem">${p.rating || '—'}</span>
            <span style="color:var(--text-muted); font-size:.75rem">(${p.reviews || 0})</span>
          </div>
        </td>
        <td>
          <div class="table-actions">
            <button class="icon-btn edit" onclick="editProduct('${p.id}')" title="Sửa">✏️</button>
            <button class="icon-btn delete" onclick="confirmDelete('${p.id}')" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>`;
  }

  /* ══════════════════════════════════════════
     NAVIGATION
  ══════════════════════════════════════════ */
  function setupNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => switchPage(item.dataset.page));
    });
  }

  window.switchPage = function(pageId) {
    // Deactivate all
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Activate target
    const pageEl = document.getElementById('page-' + pageId);
    if (pageEl) pageEl.classList.add('active');
    const navEl = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (navEl) navEl.classList.add('active');

    // Update topbar
    const titles = {
      'dashboard':   ['Dashboard', 'Tổng quan cửa hàng'],
      'products':    ['Quản Lý Sản Phẩm', 'Danh sách tất cả sản phẩm'],
      'add-product': ['Thêm Sản Phẩm', 'Điền thông tin sản phẩm mới'],
      'github':      ['Cấu Hình GitHub', 'Kết nối GitHub Pages'],
      'export':      ['Xuất / Nhập Dữ Liệu', 'Backup và khôi phục dữ liệu'],
    };
    const [title, sub] = titles[pageId] || ['Admin', ''];
    setEl('pageTitle', title);
    setEl('pageSubtitle', sub);

    // If add/edit page, reset if not editing
    if (pageId === 'add-product' && !editingId) {
      resetForm();
    }
    if (pageId === 'products') renderProductsTable();
    if (pageId === 'dashboard') renderDashboard();
  };

  window.goPage = function(n) { currentPage = n; renderProductsTable(); };

  /* ══════════════════════════════════════════
     SEARCH & FILTER
  ══════════════════════════════════════════ */
  function setupSearch() {
    document.getElementById('productSearch')?.addEventListener('input', function() {
      currentPage = 1;
      renderProductsTable(this.value, document.getElementById('categoryFilter').value);
    });
    document.getElementById('categoryFilter')?.addEventListener('change', function() {
      currentPage = 1;
      renderProductsTable(document.getElementById('productSearch').value, this.value);
    });
  }

  /* ══════════════════════════════════════════
     FORM — ADD / EDIT
  ══════════════════════════════════════════ */
  function setupForm() {
    document.getElementById('productForm').addEventListener('submit', saveProduct);
  }

  window.resetForm = function() {
    editingId = null;
    pendingImages = [];
    document.getElementById('productForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('imagesPreview').innerHTML = '';
    setEl('saveBtn', '💾 Lưu Sản Phẩm');
    document.getElementById('pageTitle').textContent = 'Thêm Sản Phẩm';
  };

  window.editProduct = function(id) {
    const p = products.find(p => p.id === id);
    if (!p) return;
    editingId = id;
    pendingImages = (p.images || []).map(url => ({ url, isFile: false }));

    document.getElementById('editId').value = id;
    document.getElementById('f-name').value         = p.name || '';
    document.getElementById('f-category').value     = p.category || '';
    document.getElementById('f-badge').value        = p.badge || '';
    document.getElementById('f-price').value        = p.price || '';
    document.getElementById('f-originalPrice').value= p.originalPrice || '';
    document.getElementById('f-rating').value       = p.rating || '';
    document.getElementById('f-reviews').value      = p.reviews || '';
    document.getElementById('f-description').value  = p.description || '';
    document.getElementById('f-inStock').value      = String(p.inStock !== false);

    renderImagePreviews();
    switchPage('add-product');
    setEl('saveBtn', '💾 Cập Nhật Sản Phẩm');
    document.getElementById('pageTitle').textContent = 'Sửa Sản Phẩm';
  };

  function saveProduct(e) {
    e.preventDefault();

    const name        = document.getElementById('f-name').value.trim();
    const category    = document.getElementById('f-category').value;
    const badge       = document.getElementById('f-badge').value;
    const price       = parseInt(document.getElementById('f-price').value) || 0;
    const origPrice   = parseInt(document.getElementById('f-originalPrice').value) || price;
    const rating      = parseFloat(document.getElementById('f-rating').value) || 4.5;
    const reviews     = parseInt(document.getElementById('f-reviews').value) || 0;
    const description = document.getElementById('f-description').value.trim();
    const inStock     = document.getElementById('f-inStock').value === 'true';
    const images      = pendingImages.map(i => i.url).filter(Boolean);

    if (!name || !category || !price) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
      return;
    }

    if (editingId) {
      const idx = products.findIndex(p => p.id === editingId);
      if (idx !== -1) {
        products[idx] = { ...products[idx], name, category, badge, price, originalPrice: origPrice, rating, reviews, description, inStock, images };
        showToast('✓ Đã cập nhật sản phẩm!', 'success');
      }
    } else {
      const newProduct = {
        id: Date.now().toString(),
        name, category, badge, price, originalPrice: origPrice,
        rating, reviews, description, inStock, images
      };
      products.push(newProduct);
      showToast('✓ Đã thêm sản phẩm mới!', 'success');
    }

    saveProductsLocal();
    renderAll();
    resetForm();
    switchPage('products');
  }

  /* ══════════════════════════════════════════
     IMAGES
  ══════════════════════════════════════════ */
  window.addImageUrl = function() {
    const input = document.getElementById('imgUrlInput');
    const url   = input.value.trim();
    if (!url) { showToast('Vui lòng nhập URL ảnh', 'error'); return; }
    if (!url.startsWith('http')) { showToast('URL không hợp lệ', 'error'); return; }
    pendingImages.push({ url, isFile: false });
    input.value = '';
    renderImagePreviews();
    showToast('✓ Đã thêm ảnh từ URL', 'success');
  };

  window.handleFileUpload = function(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUrl = e.target.result;
        // For GitHub Pages (no server), store as Data URL or user must host externally
        // We'll store the dataUrl for preview but note the limitation
        pendingImages.push({ url: dataUrl, isFile: true, name: file.name });
        renderImagePreviews();
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
    if (files.length) showToast(`✓ Đã tải lên ${files.length} ảnh`, 'info');
  };

  window.removeImage = function(idx) {
    pendingImages.splice(idx, 1);
    renderImagePreviews();
  };

  window.setMainImage = function(idx) {
    if (idx > 0) {
      const [main] = pendingImages.splice(idx, 1);
      pendingImages.unshift(main);
      renderImagePreviews();
    }
  };

  function renderImagePreviews() {
    const container = document.getElementById('imagesPreview');
    if (!container) return;
    container.innerHTML = pendingImages.map((img, i) => `
      <div class="img-preview-item ${i===0?'primary-img':''}" title="${i===0?'Ảnh chính':'Click để đặt làm ảnh chính'}">
        <img src="${img.url}" alt="preview" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\'><rect fill=\\'%231e1e25\\' width=\\'100\\' height=\\'100\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%23888\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>?</text></svg>'">
        <button type="button" class="remove-img" onclick="removeImage(${i})">✕</button>
        ${i > 0 ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.6);text-align:center;font-size:.6rem;padding:2px;cursor:pointer;color:#fff" onclick="setMainImage(${i})">Đặt Chính</div>` : ''}
        ${img.isFile ? `<div style="position:absolute;top:4px;left:4px;background:rgba(240,160,96,.9);color:#000;font-size:.55rem;border-radius:4px;padding:1px 4px;font-weight:700">LOCAL</div>` : ''}
      </div>`).join('');
  }

  function setupDragDrop() {
    const area = document.getElementById('uploadArea');
    if (!area) return;
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', e => {
      e.preventDefault();
      area.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          pendingImages.push({ url: ev.target.result, isFile: true, name: file.name });
          renderImagePreviews();
        };
        reader.readAsDataURL(file);
      });
      if (files.length) showToast(`✓ Đã kéo thả ${files.length} ảnh`, 'info');
    });
  }

  /* ══════════════════════════════════════════
     DELETE
  ══════════════════════════════════════════ */
  window.confirmDelete = function(id) {
    const p = products.find(p => p.id === id);
    if (!p) return;
    deleteTargetId = id;
    setEl('deleteProductName', `"${p.name}"`);
    document.getElementById('deleteModal').classList.add('open');
    document.getElementById('confirmDeleteBtn').onclick = () => doDelete(id);
  };

  window.closeDeleteModal = function() {
    document.getElementById('deleteModal').classList.remove('open');
    deleteTargetId = null;
  };

  function doDelete(id) {
    products = products.filter(p => p.id !== id);
    saveProductsLocal();
    renderAll();
    closeDeleteModal();
    showToast('🗑 Đã xóa sản phẩm', 'success');
  }

  /* ══════════════════════════════════════════
     GITHUB CONFIG
  ══════════════════════════════════════════ */
  function loadGithubConfig() {
    const cfg = getGithubConfig();
    setValue('gh-username', cfg.user   || '');
    setValue('gh-repo',     cfg.repo   || '');
    setValue('gh-branch',   cfg.branch || 'main');
    setValue('gh-filepath', cfg.path   || 'products.json');
    setValue('gh-token',    cfg.token  || '');

    const userEl = document.getElementById('usernameDisplay');
    if (userEl) userEl.textContent = cfg.user ? `@${cfg.user}` : 'Chưa cấu hình';

    updateSiteUrlDisplay(cfg);
  }

  function getGithubConfig() {
    return {
      user:   localStorage.getItem(KEYS.ghUser)   || '',
      repo:   localStorage.getItem(KEYS.ghRepo)   || '',
      branch: localStorage.getItem(KEYS.ghBranch) || 'main',
      path:   localStorage.getItem(KEYS.ghPath)   || 'products.json',
      token:  localStorage.getItem(KEYS.ghToken)  || '',
    };
  }

  window.saveGithubConfig = function() {
    localStorage.setItem(KEYS.ghUser,   getValue('gh-username'));
    localStorage.setItem(KEYS.ghRepo,   getValue('gh-repo'));
    localStorage.setItem(KEYS.ghBranch, getValue('gh-branch') || 'main');
    localStorage.setItem(KEYS.ghPath,   getValue('gh-filepath') || 'products.json');
    localStorage.setItem(KEYS.ghToken,  getValue('gh-token'));

    const cfg = getGithubConfig();
    const userEl = document.getElementById('usernameDisplay');
    if (userEl) userEl.textContent = cfg.user ? `@${cfg.user}` : 'Chưa cấu hình';
    updateSiteUrlDisplay(cfg);
    showToast('✓ Đã lưu cấu hình GitHub!', 'success');
    updateGithubStatusDash();
  };

  function updateSiteUrlDisplay(cfg) {
    const el = document.getElementById('siteUrlDisplay');
    if (!el) return;
    if (cfg.user && cfg.repo) {
      el.textContent = `https://${cfg.user}.github.io/${cfg.repo}/`;
    } else {
      el.textContent = 'https://[username].github.io/[repo-name]/';
    }
  }

  window.copySiteUrl = function() {
    const cfg = getGithubConfig();
    if (!cfg.user || !cfg.repo) { showToast('Chưa cấu hình GitHub!', 'error'); return; }
    navigator.clipboard.writeText(`https://${cfg.user}.github.io/${cfg.repo}/`).then(() => showToast('✓ Đã sao chép URL', 'success'));
  };

  window.toggleToken = function() {
    const input = document.getElementById('gh-token');
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  /* ── TEST CONNECTION ── */
  window.testConnection = async function() {
    saveGithubConfig();
    const cfg = getGithubConfig();
    if (!cfg.user || !cfg.repo || !cfg.token) {
      showStatus('red', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    showStatus('yellow', 'Đang kiểm tra kết nối...');
    try {
      const res = await fetch(`https://api.github.com/repos/${cfg.user}/${cfg.repo}`, {
        headers: { Authorization: `Bearer ${cfg.token}`, 'X-GitHub-Api-Version': '2022-11-28' }
      });
      if (res.ok) {
        const data = await res.json();
        showStatus('green', `✓ Kết nối thành công! Repo: ${data.full_name} | ${data.visibility}`);
        showToast('✓ Kết nối thành công!', 'success');
      } else if (res.status === 401) {
        showStatus('red', '✕ Token không hợp lệ hoặc hết hạn');
      } else if (res.status === 404) {
        showStatus('red', '✕ Không tìm thấy repository. Kiểm tra username/repo name');
      } else {
        showStatus('red', `✕ Lỗi HTTP ${res.status}`);
      }
    } catch(e) {
      showStatus('red', '✕ Lỗi mạng: ' + e.message);
    }
  };

  function showStatus(color, msg) {
    const el  = document.getElementById('connectionStatus');
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    if (!el) return;
    el.style.display = 'flex';
    dot.className = `status-dot ${color}`;
    txt.textContent = msg;
  }

  /* ══════════════════════════════════════════
     PUBLISH TO GITHUB
  ══════════════════════════════════════════ */
  window.publishToGitHub = async function() {
    const cfg = getGithubConfig();
    if (!cfg.user || !cfg.repo || !cfg.token) {
      showToast('Vui lòng cấu hình GitHub trước!', 'error');
      switchPage('github');
      return;
    }

    // Open modal
    const modal       = document.getElementById('publishModal');
    const statusEl    = document.getElementById('publishStatus');
    const progressEl  = document.getElementById('publishProgress');
    const logEl       = document.getElementById('publishLog');
    const footerEl    = document.getElementById('publishFooter');
    const viewBtn     = document.getElementById('viewSiteBtn');

    modal.classList.add('open');
    footerEl.style.display = 'none';
    progressEl.style.width = '0%';
    logEl.style.display = 'none';
    logEl.innerHTML = '';

    function setStatus(msg) { statusEl.textContent = msg; }
    function setProgress(pct) { progressEl.style.width = pct + '%'; }
    function appendLog(msg) {
      logEl.style.display = 'block';
      logEl.innerHTML += `<div>${msg}</div>`;
      logEl.scrollTop = logEl.scrollHeight;
    }

    try {
      setStatus('🔍 Lấy thông tin file hiện tại...');
      setProgress(20);

      // Get current file SHA (needed for update)
      const apiBase = `https://api.github.com/repos/${cfg.user}/${cfg.repo}/contents/${cfg.path}`;
      const headers = {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      };

      let sha = null;
      const getRes = await fetch(`${apiBase}?ref=${cfg.branch}`, { headers });
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
        appendLog(`✓ Tìm thấy file hiện tại (SHA: ${sha.slice(0,7)}...)`);
      } else if (getRes.status === 404) {
        appendLog('📝 File chưa tồn tại — sẽ tạo mới');
      } else {
        throw new Error(`Không thể lấy file: HTTP ${getRes.status}`);
      }

      setProgress(50);
      setStatus('📤 Đang đẩy dữ liệu lên GitHub...');

      // Encode to base64
      const jsonStr = JSON.stringify(products, null, 2);
      const b64     = btoa(unescape(encodeURIComponent(jsonStr)));

      const body = {
        message: `🔄 Update products.json - ${new Date().toLocaleString('vi-VN')}`,
        content: b64,
        branch:  cfg.branch,
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(apiBase, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });

      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${putRes.status}`);
      }

      setProgress(90);
      appendLog('✓ Đã đẩy products.json lên GitHub thành công!');
      appendLog('⏳ GitHub Pages đang rebuild... (~30-60 giây)');

      setStatus('✅ Đăng lên thành công!');
      setProgress(100);

      viewBtn.href = `https://${cfg.user}.github.io/${cfg.repo}/`;
      footerEl.style.display = 'flex';
      showToast('🚀 Đăng lên GitHub thành công!', 'success');

    } catch(e) {
      setStatus('❌ Lỗi: ' + e.message);
      appendLog('✕ Lỗi: ' + e.message);
      progressEl.style.background = 'linear-gradient(135deg, #f06060, #f09090)';
      footerEl.style.display = 'flex';
      showToast('Lỗi khi đăng lên GitHub!', 'error');
    }
  };

  /* ── SYNC FROM GITHUB ── */
  window.syncFromGitHub = async function() {
    const cfg = getGithubConfig();
    if (!cfg.user || !cfg.repo) {
      showToast('Cấu hình GitHub trước!', 'error');
      return;
    }
    showToast('🔄 Đang đồng bộ...', 'info');
    try {
      const url = `https://raw.githubusercontent.com/${cfg.user}/${cfg.repo}/${cfg.branch}/${cfg.path}?t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải file từ GitHub');
      products = await res.json();
      saveProductsLocal();
      renderAll();
      showToast('✓ Đồng bộ thành công!', 'success');
    } catch(e) {
      showToast('Lỗi đồng bộ: ' + e.message, 'error');
    }
  };

  /* ══════════════════════════════════════════
     EXPORT / IMPORT
  ══════════════════════════════════════════ */
  window.exportJSON = function() {
    const json = JSON.stringify(products, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `products_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Đã xuất file JSON', 'success');
  };

  window.importJSON = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('File không hợp lệ');
        products = data;
        saveProductsLocal();
        renderAll();
        showToast(`✓ Đã nhập ${data.length} sản phẩm`, 'success');
      } catch(err) {
        showToast('File JSON không hợp lệ!', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  window.clearAllData = function() {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu? Không thể hoàn tác!')) return;
    products = [];
    saveProductsLocal();
    renderAll();
    showToast('🗑 Đã xóa toàn bộ dữ liệu', 'success');
  };

  /* ══════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════ */
  let toastTimer;
  function showToast(msg, type = 'info') {
    const el = document.getElementById('adminToast');
    el.textContent = msg;
    el.className = `toast-admin ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  /* ══════════════════════════════════════════
     UTILS
  ══════════════════════════════════════════ */
  function formatPrice(n) { return Number(n).toLocaleString('vi-VN') + '₫'; }
  function setEl(id, val)  { const el = document.getElementById(id); if(el) el.textContent = val; }
  function getValue(id)    { return document.getElementById(id)?.value?.trim() || ''; }
  function setValue(id, v) { const el = document.getElementById(id); if(el) el.value = v; }

  /* ══════════════════════════════════════════
     START
  ══════════════════════════════════════════ */
  init();

})();
