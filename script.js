const CDN = "https://maz-82927.myshopify.com/cdn/shop/files/";

const variants = [
    ["wood", "الخشبي", "khashabi"],
    ["beige", "البيج", "beige"],
    ["stone", "الحجري", "hagari"],
].map(([id, name, file]) => ({
    id,
    name,
    price: 1800,
    images: [1, 2, 3, 4].map(
        (number) => `fazat-alkharshoufa-${file}-0${number}.jpg`
    ),
}));

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const requestedVariant = new URLSearchParams(window.location.search).get(
    "variant"
);

let variant =
    variants.find((item) => item.id === requestedVariant) || variants[1];

let image = 0;
let cart = [];

try {
    cart = JSON.parse(localStorage.getItem("maz-cart")) || [];
} catch {
    cart = [];
}

function imageUrl(filename) {
    return `${CDN}${filename}?v=1786121005`;
}

function money(amount) {
    return `AED ${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function renderGallery() {
    const featuredImage = $("#featured");
    const thumbnails = $("#thumbs");

    featuredImage.src = imageUrl(variant.images[image]);
    featuredImage.alt = `فازة الخرشوفه - ${variant.name}`;

    thumbnails.innerHTML = variant.images
        .map(
            (filename, index) => `
        <button
          type="button"
          data-i="${index}"
          class="${index === image ? "active" : ""}"
          aria-label="عرض الصورة ${index + 1}"
        >
          <img
            src="${imageUrl(filename)}"
            alt="فازة الخرشوفه - ${variant.name} - صورة ${index + 1}"
          >
        </button>
      `
        )
        .join("");

    $$("#thumbs button").forEach((button) => {
        button.addEventListener("click", () => {
            image = Number(button.dataset.i);
            renderGallery();
        });
    });
}

function renderVariants() {
    const variantsContainer = $("#variants");

    variantsContainer.innerHTML = variants
        .map(
            (item) => `
        <span class="variant">
          <input
            id="${item.id}"
            name="variant"
            type="radio"
            value="${item.id}"
            ${item.id === variant.id ? "checked" : ""}
          >
          <label for="${item.id}">${item.name}</label>
        </span>
      `
        )
        .join("");

    variants.forEach((item) => {
        const input = $(`#${item.id}`);

        input.addEventListener("change", () => {
            variant = item;
            image = 0;

            const url = new URL(window.location.href);
            url.searchParams.set("variant", item.id);
            history.replaceState({}, "", url);

            renderGallery();
        });
    });
}

function updateQuantity(value) {
    const quantityInput = $("#quantity");
    const minimum = Number(quantityInput.min) || 1;
    const maximum = Number(quantityInput.max) || 2;

    const quantity = Math.max(
        minimum,
        Math.min(maximum, Number(value) || minimum)
    );

    quantityInput.value = quantity;

    $$('[name="offer"]').forEach((radio) => {
        radio.checked = Number(radio.value) === quantity;
        radio.parentElement.classList.toggle("active", radio.checked);
    });
}

function saveCart() {
    localStorage.setItem("maz-cart", JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    const itemCount = cart.reduce((total, item) => total + item.qty, 0);
    const cartCount = $("#cart-count");

    cartCount.textContent = itemCount;

    $("#cart-items").innerHTML = cart.length
        ? cart
            .map(
                (item, index) => `
            <div class="cart-row">
              <img
                src="${imageUrl(item.image)}"
                alt="فازة الخرشوفه - ${item.name}"
              >

              <div>
                <b>فازة الخرشوفه</b>
                <p>${item.name} × ${item.qty}</p>
                <span>${money(item.price * item.qty)}</span>
              </div>

              <button
                type="button"
                data-remove="${index}"
                aria-label="حذف المنتج"
              >
                حذف
              </button>
            </div>
          `
            )
            .join("")
        : "<p>السلة فارغة.</p>";

    const total = cart.reduce(
        (sum, item) => sum + item.qty * item.price,
        0
    );

    $(".total b").textContent = money(total);

    $$("[data-remove]").forEach((button) => {
        button.addEventListener("click", () => {
            cart.splice(Number(button.dataset.remove), 1);
            saveCart();
        });
    });
}

function showToast(message) {
    const toast = $("#toast");

    toast.textContent = message;
    toast.classList.add("show");

    window.setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

function addToCart() {
    const quantity = Number($("#quantity").value) || 1;
    const existingItem = cart.find((item) => item.id === variant.id);

    if (existingItem) {
        existingItem.qty += quantity;
    } else {
        cart.push({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            qty: quantity,
            image: variant.images[0],
        });
    }

    saveCart();
    showToast("تمت إضافة المنتج إلى السلة");

    const cartDialog = $("#cart");

    if (typeof cartDialog.showModal === "function") {
        cartDialog.showModal();
    }
}

function showPreviousImage() {
    image = (image - 1 + variant.images.length) % variant.images.length;
    renderGallery();
}

function showNextImage() {
    image = (image + 1) % variant.images.length;
    renderGallery();
}

function initializeGallerySwipe() {
    const stage = $(".stage");
    let startX = 0;
    let startY = 0;

    stage.addEventListener(
        "touchstart",
        (event) => {
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
        },
        { passive: true }
    );

    stage.addEventListener(
        "touchend",
        (event) => {
            const deltaX = event.changedTouches[0].clientX - startX;
            const deltaY = event.changedTouches[0].clientY - startY;

            if (
                Math.abs(deltaX) < 45 ||
                Math.abs(deltaX) <= Math.abs(deltaY)
            ) {
                return;
            }

            if (deltaX > 0) {
                showPreviousImage();
            } else {
                showNextImage();
            }
        },
        { passive: true }
    );
}

function initializeAccordions() {
    $$(".accordions button").forEach((button) => {
        button.setAttribute("aria-expanded", "false");

        button.addEventListener("click", () => {
            const shouldOpen = !button.classList.contains("open");

            $$(".accordions button").forEach((otherButton) => {
                otherButton.classList.remove("open");
                otherButton.setAttribute("aria-expanded", "false");
                otherButton.nextElementSibling.hidden = true;
            });

            if (shouldOpen) {
                button.classList.add("open");
                button.setAttribute("aria-expanded", "true");
                button.nextElementSibling.hidden = false;
            }
        });
    });
}

function initializeStickyCart() {
    const buyButton = $("#buy");
    const stickyCart = $(".sticky");

    if (!buyButton || !stickyCart || !("IntersectionObserver" in window)) {
        return;
    }

    const observer = new IntersectionObserver(
        ([entry]) => {
            stickyCart.classList.toggle("visible", !entry.isIntersecting);
        },
        {
            threshold: 0,
        }
    );

    observer.observe(buyButton);
}

function renderRelatedProducts() {
    $("#related").innerHTML = variants
        .map(
            (item) => `
        <a class="card" href="?variant=${item.id}">
          <img
            src="${imageUrl(item.images[0])}"
            alt="فازة الخرشوفه - ${item.name}"
            loading="lazy"
          >

          <h3>فازة الخرشوفه — ${item.name}</h3>
          <p>${money(item.price)}</p>
        </a>
      `
        )
        .join("");
}

function initializePage() {
    renderVariants();
    renderGallery();
    renderCart();
    renderRelatedProducts();

    const lifestyleImage = $("#lifestyle");

    if (lifestyleImage) {
        lifestyleImage.src = imageUrl(variants[1].images[3]);
    }

    $$("[data-q]").forEach((button) => {
        button.addEventListener("click", () => {
            const currentQuantity = Number($("#quantity").value) || 1;
            const adjustment = Number(button.dataset.q);

            updateQuantity(currentQuantity + adjustment);
        });
    });

    $("#quantity").addEventListener("change", (event) => {
        updateQuantity(event.target.value);
    });

    $$('[name="offer"]').forEach((radio) => {
        radio.addEventListener("change", () => {
            updateQuantity(radio.value);
        });
    });

    $("#buy").addEventListener("click", addToCart);
    $(".sticky button").addEventListener("click", addToCart);

    $("#cart-open").addEventListener("click", () => {
        $("#cart").showModal();
    });

    $("#cart-close").addEventListener("click", () => {
        $("#cart").close();
    });

    $("#prev").addEventListener("click", showPreviousImage);
    $("#next").addEventListener("click", showNextImage);

    initializeGallerySwipe();
    initializeAccordions();
    initializeStickyCart();
}

document.addEventListener("DOMContentLoaded", initializePage);