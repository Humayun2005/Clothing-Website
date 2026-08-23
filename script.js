const products = [
    ['Coral Bloom', 'Printed & Floral'], ['Ivory Plum Garden', 'Contrast & Two-Tone'], ['Blue Meadow', 'Printed & Floral'],
    ['Emerald Elegance', 'Plain & Minimal'], ['Autumn Garden', 'Contrast & Two-Tone'], ['Royal Plum', 'Plain & Minimal'],
    ['Blush Pearl', 'Plain & Minimal'], ['Coral Blossom', 'Contrast & Two-Tone'], ['Plum Heritage', 'Plain & Minimal'],
    ['Sage Grace', 'Plain & Minimal'], ['Midnight Bloom', 'Plain & Minimal'], ['Amber Floral', 'Printed & Floral'],
    ['Rose Garden', 'Printed & Floral'], ['Plum Lily', 'Printed & Floral'], ['Monochrome Garden', 'Printed & Floral'],
    ['Violet Vine', 'Printed & Floral'], ['Mustard Daisy', 'Printed & Floral'], ['Silver Rose', 'Contrast & Two-Tone'],
    ['Striped Blossom', 'Printed & Floral']
].map(([name, category], index) => ({
    name,
    category,
    number: String(index + 1).padStart(2, '0'),
    image: `assets/${name} 2 Piece Suit.png`
}));

const grid = document.querySelector('#product-grid');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#product-search');
const modal = document.querySelector('#order-modal');
const modalImage = document.querySelector('#modal-image');
const modalProduct = document.querySelector('#modal-product');
const modalCategory = document.querySelector('#modal-category');
const cartDrawer = document.querySelector('#cart-drawer');
const cartItems = document.querySelector('#cart-items');
const cartEmpty = document.querySelector('#cart-empty');
const cartCount = document.querySelector('#cart-count');
const checkoutForm = document.querySelector('#checkout-form');
const addressField = checkoutForm.elements.address;
const imageViewer = document.querySelector('#image-viewer');
const viewerImage = document.querySelector('#viewer-image');
const heroImage = document.querySelector('#hero-product-image');
const heroNextImage = document.querySelector('#hero-next-image');
const heroCaption = document.querySelector('.image-caption strong');
const heroFrame = heroImage.closest('.hero-image-wrap');
let viewerZoom = 1;
let viewerPan = { x: 0, y: 0, startX: 0, startY: 0, dragging: false };
let selectedProduct = null;
let activeFilter = 'all';
let editingCartIndex = null;
let cart = [];
let heroProductIndex = 0;
let heroAutoplay = null;
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
    const visibleProducts = products.filter(product => {
        const matchesFilter = activeFilter === 'all' || product.category === activeFilter;
        const matchesSearch = product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    });

    grid.innerHTML = visibleProducts.map(product => `
    <article class="product-card">
      <div class="product-image">
                <button class="product-preview" data-product="${product.number}" aria-label="View ${product.name} larger"><img src="${product.image}" alt="${product.name} 2 piece suit" loading="lazy"></button>
        <button class="order-button" data-product="${product.number}" aria-label="Order ${product.name}">↗</button>
      </div>
      <div class="product-info"><div><h3>${product.name}</h3><p>${product.category}</p></div><span class="product-number">${product.number}</span></div>
    </article>
  `).join('');
    emptyState.hidden = visibleProducts.length > 0;
}

function changeHeroProduct(direction) {
    heroProductIndex = (heroProductIndex + direction + products.length) % products.length;
    const product = products[heroProductIndex];
    const movement = direction > 0 ? 'slide-next' : 'slide-prev';
    const startSlide = () => {
        heroFrame.classList.remove('slide-next', 'slide-prev');
        void heroFrame.offsetWidth;
        heroFrame.classList.add(movement);
    };
    heroNextImage.onload = startSlide;
    heroNextImage.onerror = () => {
        heroNextImage.onload = null;
        heroNextImage.onerror = null;
        heroFrame.classList.remove('slide-next', 'slide-prev');
        heroNextImage.src = heroImage.src;
    };
    heroNextImage.src = product.image;
    heroNextImage.alt = `${product.name} 2 piece suit`;
    heroCaption.textContent = product.name;
    if (heroNextImage.complete) requestAnimationFrame(startSlide);
    heroFrame.addEventListener('animationend', () => {
        heroNextImage.onload = null;
        heroNextImage.onerror = null;
        heroImage.src = heroNextImage.src;
        heroImage.alt = heroNextImage.alt;
        heroNextImage.src = heroImage.src;
        heroNextImage.alt = '';
        heroFrame.classList.remove('slide-next', 'slide-prev');
    }, { once: true });
}

function openModal(product) {
    selectedProduct = product;
    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalProduct.textContent = `${product.name} 2 Piece Suit`;
    modalCategory.textContent = product.category;
    document.querySelector('#order-form').reset();
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

function openCart() {
    renderCart();
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function renderCart() {
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    cartEmpty.hidden = cart.length > 0;
    checkoutForm.hidden = cart.length === 0;
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item"><img src="${item.product.image}" alt="${item.product.name}"><div class="cart-item-copy"><strong>${item.product.name}</strong><small>${item.size} · ${item.details || 'No extra notes'}</small><div class="cart-item-actions"><button data-cart-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-cart-action="increase" data-index="${index}" aria-label="Increase quantity">+</button><button class="edit-item" data-cart-action="edit" data-index="${index}">Edit</button><button class="remove-item" data-cart-action="remove" data-index="${index}">Remove</button></div></div></div>
    `).join('');
}

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.filter.active').classList.remove('active');
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    renderProducts();
}));
searchInput.addEventListener('input', renderProducts);
grid.addEventListener('click', event => {
    const button = event.target.closest('.order-button');
    if (button) openModal(products[Number(button.dataset.product) - 1]);
    const preview = event.target.closest('.product-preview');
    if (preview) openImageViewer(products[Number(preview.dataset.product) - 1]);
});
document.querySelector('#cart-trigger').addEventListener('click', openCart);
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
    if (viewerZoom === 1) return;
    event.preventDefault();
    viewerPan.dragging = true;
    viewerPan.startX = event.clientX - viewerPan.x;
    viewerPan.startY = event.clientY - viewerPan.y;
    viewerImage.setPointerCapture(event.pointerId);
    viewerImage.classList.add('is-dragging');
});
viewerImage.addEventListener('pointermove', event => {
    if (!viewerPan.dragging) return;
    viewerPan.x = event.clientX - viewerPan.startX;
    viewerPan.y = event.clientY - viewerPan.startY;
    viewerImage.style.transform = `translate(${viewerPan.x}px, ${viewerPan.y}px) scale(${viewerZoom})`;
});
viewerImage.addEventListener('pointerup', event => {
    viewerPan.dragging = false;
    if (viewerImage.hasPointerCapture(event.pointerId)) viewerImage.releasePointerCapture(event.pointerId);
    viewerImage.classList.remove('is-dragging');
    viewerImage.style.cursor = viewerZoom > 1 ? 'grab' : 'zoom-in';
});
viewerImage.addEventListener('pointercancel', event => {
    viewerPan.dragging = false;
    if (viewerImage.hasPointerCapture(event.pointerId)) viewerImage.releasePointerCapture(event.pointerId);
    viewerImage.classList.remove('is-dragging');
    viewerImage.style.cursor = viewerZoom > 1 ? 'grab' : 'zoom-in';
});
document.querySelectorAll('[data-hero-direction]').forEach(button => button.addEventListener('click', () => changeHeroProduct(button.dataset.heroDirection === 'next' ? 1 : -1)));
let heroTouchStartX = 0;
heroFrame.addEventListener('touchstart', event => {
    heroTouchStartX = event.changedTouches[0].clientX;
}, { passive: true });
heroFrame.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - heroTouchStartX;
    if (Math.abs(distance) < 45) return;
    changeHeroProduct(distance < 0 ? 1 : -1);
}, { passive: true });
heroAutoplay = setInterval(() => changeHeroProduct(1), 5000);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); if (event.key === 'Escape' && cartDrawer.classList.contains('open')) closeCart(); if (event.key === 'Escape' && imageViewer.classList.contains('open')) closeImageViewer(); if (imageViewer.classList.contains('open') && (event.key === '+' || event.key === '=')) setViewerZoom(viewerZoom + 0.25); if (imageViewer.classList.contains('open') && event.key === '-') setViewerZoom(viewerZoom - 0.25); });
document.querySelector('#order-form').addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const item = { product: selectedProduct, size: formData.get('size'), details: formData.get('details'), quantity: 1 };
    if (editingCartIndex === null) cart.push(item); else { item.quantity = cart[editingCartIndex].quantity; cart[editingCartIndex] = item; }
    editingCartIndex = null;
    closeModal();
    openCart();
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
    addressField.setCustomValidity(!address ? 'Please enter your Leicester delivery address.' : !/^[A-Za-z0-9 .,/#'()\-\r\n]{1,1000}$/.test(address) ? 'Use letters, numbers, spaces, and common address punctuation only, up to 1000 characters.' : '');
    if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
    }
    const formData = new FormData(event.currentTarget);
    const items = cart.map((item, index) => `${index + 1}. ${item.product.name} 2 Piece Suit x${item.quantity}\n   Size: ${item.size}\n   Notes: ${item.details || 'None'}`).join('\n');
    const message = `Hello ASMA Boutique, I would like to place an order:\n\n${items}\n\nName: ${formData.get('name') || 'Not provided'}\nMobile: ${formData.get('phone')}\nDelivery address: ${formData.get('address') || 'Not provided'}\nAnything else: ${formData.get('other') || 'None'}\n\nI confirm delivery is within Leicester.`;
    window.open(`https://wa.me/923112558691?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

document.querySelector('.menu-toggle').addEventListener('click', event => {
    const button = event.currentTarget;
    const nav = document.querySelector('.site-nav');
    const isOpen = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});
document.querySelectorAll('.site-nav a').forEach(link => link.addEventListener('click', () => {
    document.querySelector('.site-nav').classList.remove('open');
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
    document.querySelector('.menu-toggle').setAttribute('aria-label', 'Open menu');
}));

renderProducts();
renderCart();
