"use strict";

const CDN =
    "https://maz-82927.myshopify.com/cdn/shop/files/";

const WHATSAPP_NUMBER = "971509666763";
const PRODUCT_NAME = "فازة الخرشوفة";

const variants = [
    ["wood", "الخشبي", "khashabi"],
    ["beige", "البيج", "beige"],
    ["stone", "الحجري", "hagari"]
].map(function ([id, name, file]) {
    return {
        id: id,
        name: name,
        price: 1800,
        images: [1, 2, 3].map(function (number) {
            return (
                "fazat-alkharshoufa-" +
                file +
                "-0" +
                number +
                ".jpg"
            );
        })
    };
});

const $ = function (selector) {
    return document.querySelector(selector);
};

const $$ = function (selector) {
    return Array.from(
        document.querySelectorAll(selector)
    );
};

const requestedVariant =
    new URLSearchParams(
        window.location.search
    ).get("variant");

let variant =
    variants.find(function (item) {
        return item.id === requestedVariant;
    }) || variants[1];

let imageIndex = 0;

function imageUrl(filename) {
    return (
        CDN +
        filename +
        "?v=1786121005"
    );
}

function money(amount) {
    return (
        "AED " +
        Number(amount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    );
}

/*
 * Product gallery
 */
function renderGallery() {
    const featuredImage = $("#featured");
    const thumbnails = $("#thumbs");

    if (!featuredImage || !thumbnails) {
        return;
    }

    const selectedImage =
        variant.images[imageIndex];

    featuredImage.src = imageUrl(selectedImage);

    featuredImage.alt =
        PRODUCT_NAME + " - " + variant.name;

    thumbnails.innerHTML = variant.images
        .map(function (filename, index) {
            const activeClass =
                index === imageIndex
                    ? "active"
                    : "";

            return `
        <button
          type="button"
          data-i="${index}"
          class="${activeClass}"
          aria-label="عرض الصورة ${index + 1}"
        >
          <img
            src="${imageUrl(filename)}"
            alt="${PRODUCT_NAME} - ${variant.name} - صورة ${index + 1
                }"
            loading="lazy"
          >
        </button>
      `;
        })
        .join("");

    $$("#thumbs button").forEach(
        function (button) {
            button.addEventListener(
                "click",
                function () {
                    imageIndex = Number(
                        button.dataset.i
                    );

                    renderGallery();
                }
            );
        }
    );
}

function showPreviousImage() {
    imageIndex =
        (
            imageIndex -
            1 +
            variant.images.length
        ) % variant.images.length;

    renderGallery();
}

function showNextImage() {
    imageIndex =
        (
            imageIndex + 1
        ) % variant.images.length;

    renderGallery();
}

/*
 * Color variants
 */
function renderVariants() {
    const variantsContainer = $("#variants");

    if (!variantsContainer) {
        return;
    }

    variantsContainer.innerHTML = variants
        .map(function (item) {
            const checked =
                item.id === variant.id
                    ? "checked"
                    : "";

            return `
        <span class="variant">
          <input
            id="variant-${item.id}"
            name="variant"
            type="radio"
            value="${item.id}"
            ${checked}
          >

          <label for="variant-${item.id}">
            ${item.name}
          </label>
        </span>
      `;
        })
        .join("");

    variants.forEach(function (item) {
        const input = $(
            "#variant-" + item.id
        );

        if (!input) {
            return;
        }

        input.addEventListener(
            "change",
            function () {
                if (!input.checked) {
                    return;
                }

                variant = item;
                imageIndex = 0;

                const currentUrl = new URL(
                    window.location.href
                );

                currentUrl.searchParams.set(
                    "variant",
                    item.id
                );

                window.history.replaceState(
                    {},
                    "",
                    currentUrl
                );

                renderGallery();
                updateWhatsAppLinks();
            }
        );
    });
}

/*
 * Quantity and offers
 */
function getQuantity() {
    const selectedOffer = $(
        'input[name="offer"]:checked'
    );

    if (selectedOffer) {
        return Number(
            selectedOffer.value
        ) || 1;
    }

    const quantityInput = $("#quantity");

    return Number(
        quantityInput?.value
    ) || 1;
}

function updateQuantity(value) {
    const quantityInput = $("#quantity");

    if (!quantityInput) {
        return;
    }

    const minimum =
        Number(quantityInput.min) || 1;

    const maximum =
        Number(quantityInput.max) || 2;

    const quantity = Math.max(
        minimum,
        Math.min(
            maximum,
            Number(value) || minimum
        )
    );

    quantityInput.value = quantity;

    $$('[name="offer"]').forEach(
        function (radio) {
            radio.checked =
                Number(radio.value) === quantity;

            const offerLabel =
                radio.closest("label");

            if (offerLabel) {
                offerLabel.classList.toggle(
                    "active",
                    radio.checked
                );
            }
        }
    );

    updateWhatsAppLinks();
}

function getOrderPrice(quantity) {
    /*
     * Special offer:
     * one item = AED 1,800
     * two items = AED 3,300
     */
    if (quantity === 2) {
        return 3300;
    }

    return variant.price * quantity;
}

/*
 * WhatsApp ordering
 */
function createWhatsAppMessage() {
    const quantity = getQuantity();
    const price = getOrderPrice(quantity);

    const productUrl = new URL(
        window.location.href
    );

    productUrl.searchParams.set(
        "variant",
        variant.id
    );

    return [
        "مرحبًا، أريد طلب المنتج التالي:",
        "",
        "المنتج: " + PRODUCT_NAME,
        "اللون: " + variant.name,
        "الكمية: " + quantity,
        "السعر: " + money(price),
        "",
        "رابط المنتج:",
        productUrl.href
    ].join("\n");
}

function getWhatsAppUrl() {
    return (
        "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(
            createWhatsAppMessage()
        )
    );
}

function updateWhatsAppLinks() {
    const whatsappUrl =
        getWhatsAppUrl();

    $$(".whatsapp-order").forEach(
        function (link) {
            link.href = whatsappUrl;
            link.target = "_blank";
            link.rel =
                "noopener noreferrer";
            link.textContent =
                "اطلب عبر الواتساب";
        }
    );

    /*
     * Also update older purchase elements in case
     * the WhatsApp class was not added in the HTML.
     */
    const mainOrderLink = $("#buy");

    if (mainOrderLink) {
        mainOrderLink.href =
            whatsappUrl;

        mainOrderLink.target =
            "_blank";

        mainOrderLink.rel =
            "noopener noreferrer";

        mainOrderLink.textContent =
            "اطلب عبر الواتساب";
    }

    const stickyOrderLink = $(
        ".sticky .whatsapp-order"
    );

    if (stickyOrderLink) {
        stickyOrderLink.href =
            whatsappUrl;
    }
}

/*
 * Gallery touch and mouse swipe
 */
function initializeGallerySwipe() {
    const stage = $(".stage");

    if (!stage) {
        return;
    }

    let pointerActive = false;
    let activePointerId = null;
    let startX = 0;
    let startY = 0;

    stage.style.touchAction = "pan-y";

    stage.addEventListener(
        "pointerdown",
        function (event) {
            if (
                !event.isPrimary ||
                event.button !== 0
            ) {
                return;
            }

            pointerActive = true;
            activePointerId =
                event.pointerId;

            startX = event.clientX;
            startY = event.clientY;

            stage.setPointerCapture(
                event.pointerId
            );
        }
    );

    stage.addEventListener(
        "pointerup",
        function (event) {
            if (
                !pointerActive ||
                event.pointerId !==
                activePointerId
            ) {
                return;
            }

            const deltaX =
                event.clientX - startX;

            const deltaY =
                event.clientY - startY;

            pointerActive = false;
            activePointerId = null;

            if (
                stage.hasPointerCapture(
                    event.pointerId
                )
            ) {
                stage.releasePointerCapture(
                    event.pointerId
                );
            }

            if (
                Math.abs(deltaX) < 45 ||
                Math.abs(deltaX) <=
                Math.abs(deltaY)
            ) {
                return;
            }

            if (deltaX > 0) {
                showPreviousImage();
            } else {
                showNextImage();
            }
        }
    );

    stage.addEventListener(
        "pointercancel",
        function () {
            pointerActive = false;
            activePointerId = null;
        }
    );

    stage.addEventListener(
        "dragstart",
        function (event) {
            event.preventDefault();
        }
    );
}

/*
 * Description, materials and return accordions
 */
function initializeAccordions() {
    const accordionButtons = $$(
        ".accordions article > button"
    );

    accordionButtons.forEach(
        function (button, index) {
            const content =
                button.nextElementSibling;

            if (!content) {
                return;
            }

            const contentId =
                "maz-accordion-content-" +
                index;

            content.id = contentId;
            content.hidden = true;

            button.type = "button";

            button.setAttribute(
                "aria-controls",
                contentId
            );

            button.setAttribute(
                "aria-expanded",
                "false"
            );

            button.addEventListener(
                "click",
                function () {
                    const currentlyOpen =
                        button.getAttribute(
                            "aria-expanded"
                        ) === "true";

                    accordionButtons.forEach(
                        function (otherButton) {
                            const otherContent =
                                otherButton
                                    .nextElementSibling;

                            otherButton.classList.remove(
                                "open"
                            );

                            otherButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );

                            if (otherContent) {
                                otherContent.hidden = true;
                            }
                        }
                    );

                    if (!currentlyOpen) {
                        button.classList.add(
                            "open"
                        );

                        button.setAttribute(
                            "aria-expanded",
                            "true"
                        );

                        content.hidden = false;
                    }
                }
            );
        }
    );
}

/*
 * Sticky WhatsApp order bar
 */
function initializeStickyOrder() {
    const mainOrderLink = $("#buy");
    const stickyOrder = $(".sticky");

    if (
        !mainOrderLink ||
        !stickyOrder ||
        !(
            "IntersectionObserver" in window
        )
    ) {
        return;
    }

    const observer =
        new IntersectionObserver(
            function ([entry]) {
                stickyOrder.classList.toggle(
                    "visible",
                    !entry.isIntersecting
                );
            },
            {
                threshold: 0
            }
        );

    observer.observe(mainOrderLink);
}

/*
 * Related products
 */
function renderRelatedProducts() {
    const relatedContainer = $("#related");

    if (!relatedContainer) {
        return;
    }

    relatedContainer.innerHTML = variants
        .map(function (item) {
            return `
        <a
          class="card"
          href="?variant=${item.id}"
        >
          <img
            src="${imageUrl(
                item.images[0]
            )}"
            alt="${PRODUCT_NAME} - ${item.name
                }"
            loading="lazy"
          >

          <h3>
            ${PRODUCT_NAME} — ${item.name
                }
          </h3>

          <p>
            ${money(item.price)}
          </p>
        </a>
      `;
        })
        .join("");
}

/*
 * Initialize the page
 */
function initializePage() {
    renderVariants();
    renderGallery();
    renderRelatedProducts();

    const lifestyleImage =
        $("#lifestyle");

    if (lifestyleImage) {
        lifestyleImage.src = imageUrl(
            variants[1].images[2]
        );

        lifestyleImage.alt =
            PRODUCT_NAME +
            " في غرفة معيشة";
    }

    /*
     * Quantity buttons
     */
    $$("[data-q]").forEach(
        function (button) {
            button.addEventListener(
                "click",
                function () {
                    const currentQuantity =
                        getQuantity();

                    const adjustment =
                        Number(
                            button.dataset.q
                        ) || 0;

                    updateQuantity(
                        currentQuantity +
                        adjustment
                    );
                }
            );
        }
    );

    const quantityInput =
        $("#quantity");

    if (quantityInput) {
        quantityInput.addEventListener(
            "change",
            function (event) {
                updateQuantity(
                    event.target.value
                );
            }
        );

        quantityInput.addEventListener(
            "input",
            function (event) {
                updateQuantity(
                    event.target.value
                );
            }
        );
    }

    /*
     * Offers
     */
    $$('[name="offer"]').forEach(
        function (radio) {
            radio.addEventListener(
                "change",
                function () {
                    if (!radio.checked) {
                        return;
                    }

                    updateQuantity(
                        radio.value
                    );
                }
            );
        }
    );

    /*
     * Make complete offer labels clickable.
     */
    $$(".offers label").forEach(
        function (label) {
            label.addEventListener(
                "click",
                function () {
                    const radio =
                        label.querySelector(
                            'input[name="offer"]'
                        );

                    if (!radio) {
                        return;
                    }

                    radio.checked = true;

                    updateQuantity(
                        radio.value
                    );
                }
            );
        }
    );

    /*
     * Gallery navigation arrows
     */
    const previousButton =
        $("#prev");

    const nextButton =
        $("#next");

    if (previousButton) {
        previousButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                showPreviousImage();
            }
        );
    }

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                showNextImage();
            }
        );
    }

    initializeGallerySwipe();
    initializeAccordions();
    initializeStickyOrder();

    /*
     * Set the initially selected offer and
     * generate the first WhatsApp URL.
     */
    if (quantityInput) {
        updateQuantity(
            quantityInput.value
        );
    } else {
        updateWhatsAppLinks();
    }
}

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializePage
    );
} else {
    initializePage();
}