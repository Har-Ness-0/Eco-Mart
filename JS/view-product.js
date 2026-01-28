import { productCardData } from "./productData.js";

// Helper to parse numeric value from price strings like "रु 2000.00" or "RS 4000"
function parsePrice(str) {
  if (!str) return null;
  const num = String(str).replace(/[^0-9.]+/g, "");
  return num ? Number(num) : null;
}

function populateProductPage(data) {
  const titleEl = document.querySelector(".product-title");
  const nowEl = document.querySelector(".now");
  const wasEl = document.querySelector(".was");
  const descEl = document.querySelector(".short-desc");
  const skuEl = document.querySelector(".sku");
  const mainImg = document.getElementById("currentImage");
  const thumbImgs = document.querySelectorAll(".thumbnails .thumb img");
  const badgeEl = document.querySelector(".price .badge");
  const detailsLis = document.querySelectorAll(".details ul li");

  if (titleEl) titleEl.textContent = data.title || "Product";
  if (nowEl) nowEl.textContent = data.newPrice || "";
  if (wasEl) wasEl.textContent = data.oldPrice || "";
  if (descEl) descEl.textContent = data.desc2 || data.desc1 || "";

  if (skuEl) {
    //  Creating sku if nothing is provided
    skuEl.textContent =
      data.sku ||
      `SKU: ${
        (data.title || "").split(" ").slice(0, 3).join("-").toUpperCase() ||
        "N/A"
      }`;
  }

  // Use product-specific gallery if provided, otherwise fall back to single productImage
  const images =
    Array.isArray(data.images) && data.images.length
      ? data.images
      : Array.isArray(data.productImage) && data.productImage.length
        ? data.productImage
        : [data.productImage];

  if (mainImg && images.length) mainImg.src = images[0] || mainImg.src;

thumbImgs.forEach((img, i) => {
  if (images[i]) {
    img.src = images[i];
  } else {
    img.src = images[0] || img.src;
  }
});

  //Percentage of discount is calculated dynamically
  const oldN = parsePrice(data.oldPrice);
  const newN = parsePrice(data.newPrice);
  if (badgeEl) {
    if (oldN && newN && oldN > newN) {
      const percent = Math.round(((oldN - newN) / oldN) * 100);
      badgeEl.textContent = `${percent}% OFF`;
      badgeEl.style.display = "inline-block";
    } else {
      badgeEl.style.display = "none";
    }
  }

  // map some product fields into details list if present
  if (detailsLis && detailsLis.length >= 1) {
    if (data.desc1) detailsLis[0].textContent = data.desc1;
    if (data.desc2 && detailsLis[1])
      detailsLis[1].textContent = data.desc2.slice(0, 120) + "...";
  }
}

// On page load, read selected product from localStorage (set by productpage.js quick view)
document.addEventListener("DOMContentLoaded", () => {
  let data = null;
  try {
    const raw = localStorage.getItem("selectedProduct");
    if (raw) data = JSON.parse(raw);
  } catch (err) {
    // ignore
  }

  // fallback to an index if stored, or to the first product
  if (!data) {
    try {
      const idx = Number(localStorage.getItem("selectedProductIndex"));
      if (!Number.isNaN(idx) && productCardData[idx])
        data = productCardData[idx];
    } catch (err) {
      // ignore
    }
  }

  if (!data) data = productCardData[0];

  populateProductPage(data);

  // setup quantity controls
  const qtyInput = document.getElementById("quantity");
  const inc = document.getElementById("increase");
  const dec = document.getElementById("decrease");
  if (inc && qtyInput) inc.addEventListener("click", () => qtyInput.stepUp());
  if (dec && qtyInput)
    dec.addEventListener("click", () => {
      if (+qtyInput.value > +qtyInput.min) qtyInput.stepDown();
    });

  // expose action functions to inline handlers in HTML
  window.addToCart = function addToCart() {
    const qty = +((document.getElementById("quantity") || {}).value || 1);
    alert("Added " + qty + " item(s) to cart.");
  };
  window.buyNow = function buyNow() {
    const qty = +((document.getElementById("quantity") || {}).value || 1);
    alert("Proceeding to checkout with " + qty + " item(s).");
  };
  window.toggleWishlist = function toggleWishlist(btn) {
    const pressed = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", String(!pressed));
    btn.textContent = pressed ? "♡ Wishlist" : "♥ Wishlist";
  };
});

// gallery

document.addEventListener("click", (e) => {
  const thumb = e.target.closest(".thumb");
  if (!thumb) return;

  const img = thumb.querySelector("img");
  document.getElementById("currentImage").src = img.src;
});

// quantity controls
// const qtyInput = document.getElementById("quantity");
// document
//   .getElementById("increase")
//   .addEventListener("click", () => qtyInput.stepUp());
// document.getElementById("decrease").addEventListener("click", () => {
//   if (+qtyInput.value > +qtyInput.min) qtyInput.stepDown();
// });

// (action functions are exposed in DOMContentLoaded handler)

window.addEventListener("scroll", function () {
  const nav = document.querySelector(".navbar-container");
  if (window.scrollY > 50) {
    nav.classList.add("scrolled-window");
  } else {
    nav.classList.remove("scrolled-window");
  }
});
