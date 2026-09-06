const products = [
    ['Coral Bloom', 'Printed & Floral', 'XL', 25], ['Ivory Plum Garden', 'Contrast & Two-Tone', 'XL', 20], ['Blue Meadow', 'Printed & Floral', 'L', 25],
    ['Emerald Elegance', 'Plain & Minimal', 'XL', 35], ['Autumn Garden', 'Contrast & Two-Tone', 'L', 25], ['Royal Plum', 'Plain & Minimal', 'XL', 35, true],
    ['Blush Pearl', 'Plain & Minimal', 'L', 35], ['Coral Blossom', 'Contrast & Two-Tone', 'XL', 20], ['Plum Heritage', 'Plain & Minimal', 'XL', 35],
    ['Sage Grace', 'Plain & Minimal', 'XL', 36, true], ['Midnight Bloom', 'Plain & Minimal', 'L', 35], ['Amber Floral', 'Printed & Floral', 'XL', 35],
    ['Rose Garden', 'Printed & Floral', 'XL', 20], ['Plum Lily', 'Printed & Floral', 'XL', 25], ['Monochrome Garden', 'Printed & Floral', 'L', 25],
    ['Violet Vine', 'Printed & Floral', 'XL', 25], ['Mustard Daisy', 'Printed & Floral', 'XL', 20], ['Silver Rose', 'Contrast & Two-Tone', 'XL', 20],
    ['Striped Blossom', 'Printed & Floral', 'XL', 20]
].map(([name, category, size, price, outOfStock], index) => ({
    name, category, size, price, outOfStock: Boolean(outOfStock),
    number: String(index + 1).padStart(2, '0'),
    image: `assets/${name} 2 Piece Suit.png`
}));

const grid = document.querySelector('#product-grid');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#product-search');
const sizeFilter = document.querySelector('#size-filter');
const sortProducts = document.querySelector('#sort-products');
const modal = document.querySelector('#order-modal');
const modalImage = document.querySelector('#modal-image');
const modalProduct = document.querySelector('#modal-product');
const modalCategory = document.querySelector('#modal-category');
const cartDrawer = document.querySelector('#cart-drawer');
const cartItems = document.querySelector('#cart-items');
const cartEmpty = document.querySelector('#cart-empty');
const cartTotal = document.querySelector('#cart-total');
const cartCount = document.querySelector('#cart-count');
const checkoutForm = document.querySelector('#checkout-form');
const addressField = checkoutForm.elements.address;
const imageViewer = document.querySelector('#image-viewer');
const viewerImage = document.querySelector('#viewer-image');
let viewerZoom = 1;
let viewerPan = { x: 0, y: 0, startX: 0, startY: 0, dragging: false };
let viewerPointers = new Map();
let viewerPinchStartDistance = 0;
let viewerPinchStartZoom = 1;
let selectedProduct = null;
let activeFilter = 'all';
let activeSize = 'all';
let activeSort = 'default';
let editingCartIndex = null;
let cart = [];
const preloadedProductImages = products.map(product => {
    const image = new Image();
    image.src = product.image;
    return image;
});

const addressCharacterPattern = /^[A-Za-z0-9 .,/#'()\-\r\n]*$/;

addressField.addEventListener('beforeinput', event => {
    if (event.data && !addressCharacterPattern.test(event.data)) event.preventDefault();
});
addressField.addEventListener('input', event => {
    const field = event.currentTarget;
    const filtered = field.value.replace(/[^A-Za-z0-9 .,/#'()\-\r\n]/g, '');
    if (filtered !== field.value) {
        const cursor = field.selectionStart - (field.value.length - filtered.length);
        field.value = filtered;
        field.setSelectionRange(Math.max(0, cursor), Math.max(0, cursor));
    }
});

function renderProducts() {
    const query = searchInput.value.trim().toLowerCase();
    document.querySelectorAll('.filter').forEach(button => {
        const category = button.dataset.filter;
        const count = products.filter(product => {
            const matchesCategory = category === 'all' || product.category === category;
            const matchesSize = activeSize === 'all' || product.size === activeSize;
            const matchesSearch = product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query) || product.size.toLowerCase().includes(query);
            return matchesCategory && matchesSize && matchesSearch;
        }).length;
        button.querySelector('small').textContent = count;
    });

    const visibleProducts = products.filter(product => {
        const matchesFilter = activeFilter === 'all' || product.category === activeFilter;
        const matchesSize = activeSize === 'all' || product.size === activeSize;
        const matchesSearch = product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query) || product.size.toLowerCase().includes(query);
        return matchesFilter && matchesSize && matchesSearch;
    }).sort((first, second) => {
        if (first.outOfStock !== second.outOfStock) return Number(first.outOfStock) - Number(second.outOfStock);
        if (activeSort === 'price-low') return first.price - second.price;
        if (activeSort === 'price-high') return second.price - first.price;
        return Number(first.number) - Number(second.number);
    });

    grid.innerHTML = visibleProducts.map((product, index) => `
    <article class="product-card${product.outOfStock ? ' is-out-of-stock' : ''}">
      <div class="product-image">
                <button class="product-preview" data-product="${product.number}" aria-label="View ${product.name} larger"><img src="${product.image}" alt="${product.name} 2 piece suit" loading="lazy"></button>
                ${product.outOfStock ? '<span class="stock-badge">Out of stock</span>' : ''}
                <button class="order-button" data-product="${product.number}" aria-label="${product.outOfStock ? `${product.name} is out of stock` : `Order ${product.name}`}" ${product.outOfStock ? 'disabled' : ''}>${product.outOfStock ? '—' : '↗'}</button>
      </div>
            <div class="product-info"><div><h3>${product.name}</h3><p>${product.category}</p><div class="product-meta"><span>Size ${product.size}</span><strong>£${product.price}</strong></div></div><span class="product-number">${String(index + 1).padStart(2, '0')}</span></div>
    </article>
  `).join('');
    emptyState.hidden = visibleProducts.length > 0;
}


function openModal(product) {
    if (product.outOfStock) return;
    selectedProduct = product;
    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalProduct.textContent = `${product.name} 2 Piece Suit`;
    modalCategory.textContent = `${product.category} · Size ${product.size} · £${product.price}`;
    const sizeSelect = document.querySelector('[name="size"]');
    sizeSelect.innerHTML = `<option value="${product.size}">${product.size}</option>`;
    document.querySelector('#order-form').reset();
    sizeSelect.value = product.size;
    if (editingCartIndex !== null) {
        const item = cart[editingCartIndex];
        document.querySelector('[name="size"]').value = item.size;
        document.querySelector('[name="details"]').value = item.details;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('[name="size"]').focus();
}

function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function openImageViewer(product) {
    viewerPan = { x: 0, y: 0, startX: 0, startY: 0, dragging: false };
    viewerImage.src = product.image;
    viewerImage.alt = `${product.name} 2 piece suit`;
    viewerZoom = 1;
    viewerImage.style.transform = 'translate(0px, 0px) scale(1)';
    imageViewer.classList.add('open');
    imageViewer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeImageViewer() {
    imageViewer.classList.remove('open');
    imageViewer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function setViewerZoom(zoom) {
    viewerZoom = Math.min(3, Math.max(1, zoom));
    if (viewerZoom === 1) viewerPan = { ...viewerPan, x: 0, y: 0 };
    viewerImage.style.transform = `translate(${viewerPan.x}px, ${viewerPan.y}px) scale(${viewerZoom})`;
    viewerImage.style.cursor = viewerZoom > 1 ? 'grab' : 'zoom-in';
}

function updateViewerTransform() {
    viewerImage.style.transform = `translate(${viewerPan.x}px, ${viewerPan.y}px) scale(${viewerZoom})`;
    viewerImage.style.cursor = viewerZoom > 1 ? 'grab' : 'zoom-in';
}

function getPointerDistance(a, b) {
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function openCart() {
    renderCart();
    cartDrawer.querySelector('.cart-panel').scrollTop = 0;
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function showQuickNotice(message) {
    const notice = document.createElement('div');
    notice.className = 'quick-notice';
    notice.textContent = message;
    document.body.appendChild(notice);
    requestAnimationFrame(() => notice.classList.add('show'));
    window.setTimeout(() => {
        notice.classList.remove('show');
        window.setTimeout(() => notice.remove(), 220);
    }, 2200);
}

function closeCart() {
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function closeMenu() {
    const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.site-nav');
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
}

function renderCart() {
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    cartEmpty.hidden = cart.length > 0;
    cartTotal.hidden = cart.length === 0;
    cartTotal.querySelector('strong').textContent = `£${cart.reduce((total, item) => total + item.product.price * item.quantity, 0)}`;
    checkoutForm.hidden = cart.length === 0;
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item"><img src="${item.product.image}" alt="${item.product.name}"><div class="cart-item-copy"><strong>${item.product.name}</strong><small>${item.size} · £${item.product.price} · ${item.details || 'No extra notes'}</small><div class="cart-item-actions"><button data-cart-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-cart-action="increase" data-index="${index}" aria-label="Increase quantity">+</button><button class="edit-item" data-cart-action="edit" data-index="${index}">Edit</button><button class="remove-item" data-cart-action="remove" data-index="${index}">Remove</button></div></div></div>
    `).join('');
}

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.filter.active').classList.remove('active');
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    renderProducts();
}));
sizeFilter.addEventListener('change', event => {
    activeSize = event.target.value;
    renderProducts();
});
sortProducts.addEventListener('change', event => {
    activeSort = event.target.value;
    renderProducts();
});
searchInput.addEventListener('input', renderProducts);
grid.addEventListener('click', event => {
    const button = event.target.closest('.order-button');
    if (button) openModal(products[Number(button.dataset.product) - 1]);
    const preview = event.target.closest('.product-preview');
    if (preview) openImageViewer(products[Number(preview.dataset.product) - 1]);
});
document.querySelector('#cart-trigger').addEventListener('click', () => {
    closeMenu();
    if (cartDrawer.classList.contains('open')) {
        closeCart();
        return;
    }
    openCart();
});
document.querySelector('[data-close-cart]').addEventListener('click', closeCart);
cartItems.addEventListener('click', event => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const index = Number(button.dataset.index);
    const action = button.dataset.cartAction;
    if (action === 'increase') cart[index].quantity += 1;
    if (action === 'decrease') cart[index].quantity = Math.max(1, cart[index].quantity - 1);
    if (action === 'remove') cart.splice(index, 1);
    if (action === 'edit') { editingCartIndex = index; closeCart(); openModal(cart[index].product); return; }
    renderCart();
});
document.querySelectorAll('[data-close-modal]').forEach(element => element.addEventListener('click', closeModal));
document.querySelectorAll('[data-close-viewer]').forEach(element => element.addEventListener('click', closeImageViewer));
viewerImage.addEventListener('wheel', event => {
    event.preventDefault();
    setViewerZoom(viewerZoom + (event.deltaY < 0 ? 0.2 : -0.2));
}, { passive: false });
viewerImage.addEventListener('dblclick', () => setViewerZoom(viewerZoom === 1 ? 2 : 1));
document.querySelectorAll('[data-close-cart]').forEach(element => element.addEventListener('click', closeCart));
viewerImage.addEventListener('pointerdown', event => {
    viewerPointers.set(event.pointerId, event);
    if (viewerPointers.size === 2) {
        const [first, second] = [...viewerPointers.values()];
        viewerPinchStartDistance = getPointerDistance(first, second);
        viewerPinchStartZoom = viewerZoom;
        viewerPan.dragging = false;
        viewerImage.classList.add('is-dragging');
        event.preventDefault();
        return;
    }
    if (viewerZoom === 1) return;
    event.preventDefault();
    viewerPan.dragging = true;
    viewerPan.startX = event.clientX - viewerPan.x;
    viewerPan.startY = event.clientY - viewerPan.y;
    viewerImage.setPointerCapture(event.pointerId);
    viewerImage.classList.add('is-dragging');
});
viewerImage.addEventListener('pointermove', event => {
    if (viewerPointers.has(event.pointerId)) viewerPointers.set(event.pointerId, event);
    if (viewerPointers.size === 2) {
        const [first, second] = [...viewerPointers.values()];
        const distance = getPointerDistance(first, second);
        setViewerZoom(viewerPinchStartZoom * (distance / viewerPinchStartDistance));
        event.preventDefault();
        return;
    }
    if (!viewerPan.dragging) return;
    viewerPan.x = event.clientX - viewerPan.startX;
    viewerPan.y = event.clientY - viewerPan.startY;
    updateViewerTransform();
});
viewerImage.addEventListener('pointerup', event => {
    viewerPointers.delete(event.pointerId);
    viewerPan.dragging = false;
    if (viewerImage.hasPointerCapture(event.pointerId)) viewerImage.releasePointerCapture(event.pointerId);
    viewerImage.classList.remove('is-dragging');
    if (viewerPointers.size < 2) {
        viewerPinchStartDistance = 0;
        viewerPinchStartZoom = viewerZoom;
    }
    viewerImage.style.cursor = viewerZoom > 1 ? 'grab' : 'zoom-in';
});
viewerImage.addEventListener('pointercancel', event => {
    viewerPointers.delete(event.pointerId);
    viewerPan.dragging = false;
    if (viewerImage.hasPointerCapture(event.pointerId)) viewerImage.releasePointerCapture(event.pointerId);
    viewerImage.classList.remove('is-dragging');
    if (viewerPointers.size < 2) {
        viewerPinchStartDistance = 0;
        viewerPinchStartZoom = viewerZoom;
    }
    viewerImage.style.cursor = viewerZoom > 1 ? 'grab' : 'zoom-in';
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); if (event.key === 'Escape' && cartDrawer.classList.contains('open')) closeCart(); if (event.key === 'Escape' && imageViewer.classList.contains('open')) closeImageViewer(); if (imageViewer.classList.contains('open') && (event.key === '+' || event.key === '=')) setViewerZoom(viewerZoom + 0.25); if (imageViewer.classList.contains('open') && event.key === '-') setViewerZoom(viewerZoom - 0.25); });
document.querySelector('#order-form').addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const item = { product: selectedProduct, size: formData.get('size'), details: formData.get('details'), quantity: 1 };
    if (editingCartIndex === null) {
        const existingItem = cart.find(cartItem => cartItem.product.number === item.product.number && cartItem.size === item.size && cartItem.details === item.details);
        if (existingItem) existingItem.quantity += 1;
        else cart.push(item);
    } else {
        item.quantity = cart[editingCartIndex].quantity;
        cart[editingCartIndex] = item;
    }
    editingCartIndex = null;
    closeModal();
    renderCart();
    showQuickNotice('Added to cart. View it in the top right or add more articles.');
});
checkoutForm.addEventListener('submit', event => {
    event.preventDefault();
    const nameField = checkoutForm.elements.name;
    const phoneField = checkoutForm.elements.phone;
    const name = nameField.value.trim();
    const phone = phoneField.value.trim();
    const address = addressField.value.trim();
    nameField.setCustomValidity(name && !/^[A-Za-z ]{1,100}$/.test(name) ? 'Use letters and spaces only, up to 100 characters.' : '');
    phoneField.setCustomValidity(!phone ? 'Please enter your mobile number.' : !/^(?=.*\d)[0-9+() ]{3,30}$/.test(phone) ? 'Use 3-30 characters: numbers, spaces, + and brackets only.' : '');
    addressField.setCustomValidity(!address ? 'Please enter your UK delivery address.' : !/^[A-Za-z0-9 .,/#'()\-\r\n]{1,1000}$/.test(address) ? 'Use letters, numbers, spaces, and common address punctuation only, up to 1000 characters.' : '');
    if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
    }
    const formData = new FormData(event.currentTarget);
    const items = cart.map((item, index) => `${index + 1}. ${item.product.name} 2 Piece Suit x${item.quantity}\n   Size: ${item.size}\n   Price: £${item.product.price} each\n   Notes: ${item.details || 'None'}`).join('\n');
    const totalAmount = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
    const message = `Hello ASMA Boutique, I would like to place an order:\n\n${items}\n\nTotal amount: £${totalAmount}\n\nName: ${formData.get('name') || 'Not provided'}\nMobile: ${formData.get('phone')}\nDelivery address: ${formData.get('address') || 'Not provided'}\nAnything else: ${formData.get('other') || 'None'}\n\nI confirm delivery is within the UK.`;
    window.open(`https://wa.me/447471039239?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

document.querySelector('.menu-toggle').addEventListener('click', event => {
    const button = event.currentTarget;
    const nav = document.querySelector('.site-nav');
    if (!nav.classList.contains('open')) closeCart();
    const isOpen = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});
document.addEventListener('click', event => {
    const nav = document.querySelector('.site-nav');
    if (nav.classList.contains('open') && !event.target.closest('.site-header')) closeMenu();
});
document.querySelectorAll('.site-nav a').forEach(link => link.addEventListener('click', () => {
    closeMenu();
}));

renderProducts();
renderCart();
