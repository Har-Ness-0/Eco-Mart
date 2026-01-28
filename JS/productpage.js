import { productCardData } from "./productData.js";

/* ===========================
   DOM REFERENCES
=========================== */
const productGrid = document.querySelector(".product-card-container");
const searchInput = document.querySelector(".search-bar-container input");
const priceSlider = document.querySelector(".price-slider");
const priceLabel = document.querySelector(".current-price");
const clearFiltersButton = document.querySelector(".clear-filters");
const quickViewModal = document.querySelector(".quick-view-container");

let minimumRating = 0;
let ratingMax = Infinity;

/* ===========================
   HELPERS
=========================== */
function parsePrice(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.]/g, "")) || 0;
}

/* ===========================
   PRODUCT CARD
=========================== */
function buildProductCard(product, index) {
  const cardWrapper = document.createElement("div");
  cardWrapper.className = "card-wrapper";

  const imageSrc =
    Array.isArray(product.images) && product.images.length
      ? product.images[0]
      : product.productImage;

  cardWrapper.innerHTML = `
    <div class="card">
      <div class="card-info">
        <div class="product-image">
          <img src="${imageSrc}" alt="${product.title}">
          <div class="quick-view-link"><span>Quick view</span></div>
        </div>

        <div class="product-info-container">
          <h1>${product.title}</h1>
          <div class="rating">
            ${"★".repeat(Math.round(product.rating || 0))}
            <span>${product.rating || ""}</span>
          </div>
          <p class="new-price">
            <span class="old-price">${product.oldPrice || ""}</span>
            ${product.newPrice || ""}
          </p>
          <p class="natural-wood">${product.desc1 || ""}</p>
          <button class="add-to-cart-btn">ADD TO CART</button>
        </div>
      </div>
    </div>
  `;

  cardWrapper
    .querySelector(".quick-view-link")
    .addEventListener("click", () => openQuickView(product));

  return cardWrapper;
}

function renderProducts(list) {
  productGrid.innerHTML = "";

  if (!list.length) {
    productGrid.innerHTML = '<p class="no-results">No products found.</p>';
    return;
  }

  list.forEach((product, i) =>
    productGrid.appendChild(buildProductCard(product, i)),
  );
}

/* ===========================
   FILTER STATE
=========================== */
function getSelectedFilters() {
  const filters = {
    categories: [],
    materials: [],
    maxPrice: Number(priceSlider?.value) || Infinity,
    searchText: searchInput?.value.toLowerCase().trim() || "",
    minRating: minimumRating,
    maxRating: ratingMax,
  };

  document
    .querySelectorAll('.filter-content input[type="checkbox"]')
    .forEach((checkbox) => {
      if (!checkbox.checked) return;

      const labelText = checkbox.parentElement.textContent.trim();
      const sectionTitle =
        checkbox.closest(".filter-section")?.querySelector(".filter-toggle")
          ?.textContent || "";

      if (/category/i.test(sectionTitle)) filters.categories.push(labelText);
      else if (/material/i.test(sectionTitle))
        filters.materials.push(labelText);
    });

  return filters;
}

/* ===========================
   FILTER LOGIC
=========================== */
function applyFilters() {
  const filters = getSelectedFilters();
  console.debug("applyFilters: filters=", filters);

  const filteredProducts = productCardData.filter((product) => {
    const price =
      parsePrice(product.price) ||
      parsePrice(product.newPrice) ||
      parsePrice(product.oldPrice);

    if (price > filters.maxPrice) return false;

    if (
      filters.categories.length &&
      !filters.categories.some((c) =>
        product.category?.toLowerCase().includes(c.toLowerCase()),
      )
    )
      return false;

    if (
      filters.materials.length &&
      !filters.materials.some((m) =>
        product.material?.toLowerCase().includes(m.toLowerCase()),
      )
    )
      return false;

    if (filters.minRating) {
      const r = Number(product.rating) || 0;
      if (r < Number(filters.minRating)) return false;
      if (
        filters.maxRating !== undefined &&
        filters.maxRating !== Infinity &&
        r >= Number(filters.maxRating)
      )
        return false;
    }

    if (filters.searchText) {
      const text =
        `${product.title} ${product.desc1 || ""} ${product.desc2 || ""}`.toLowerCase();
      if (!text.includes(filters.searchText)) return false;
    }

    return true;
  });

  renderProducts(filteredProducts);
  console.debug(
    "applyFilters: filteredProducts.length=",
    filteredProducts.length,
  );
}

/* ===========================
   PRICE SLIDER SETUP
=========================== */
if (priceSlider && priceLabel) {
  const prices = productCardData.map((p) =>
    parsePrice(p.price || p.newPrice || p.oldPrice),
  );

  priceSlider.min = Math.min(...prices);
  priceSlider.max = Math.max(...prices);
  priceSlider.value ||= priceSlider.max;

  priceLabel.textContent = `Rs ${priceSlider.value}`;

  priceSlider.addEventListener("input", () => {
    priceLabel.textContent = `Rs ${priceSlider.value}`;
    applyFilters();
  });
}

/* ===========================
   EVENT LISTENERS
=========================== */
searchInput?.addEventListener("input", applyFilters);

document
  .querySelectorAll('.filter-content input[type="checkbox"]')
  .forEach((cb) => cb.addEventListener("change", applyFilters));

// Clear filters button behavior
if (clearFiltersButton) {
  clearFiltersButton.addEventListener("click", () => {
    // uncheck all checkboxes and notify listeners
    const checkboxes = document.querySelectorAll(
      '.filter-content input[type="checkbox"]',
    );
    checkboxes.forEach((cb) => {
      cb.checked = false;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // reset search and notify
    if (searchInput) {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // reset price slider and notify
    if (priceSlider) {
      // ensure slider has max; if not, compute from data
      if (!priceSlider.max || priceSlider.max === "") {
        const prices = Array.from(productCardData, (p) =>
          parsePrice(p.price || p.newPrice || p.oldPrice),
        );
        priceSlider.max = Math.max(...prices);
      }
      priceSlider.value = priceSlider.max;
      priceSlider.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // reset rating visuals and state
    minimumRating = 0;
    ratingMax = Infinity;
    document
      .querySelectorAll(".filter-content.stars .rating-btn")
      .forEach((l) => l.classList.remove("active-star"));

    // render full list directly to ensure immediate reset
    // ensure price label is correct
    if (priceSlider && priceLabel) {
      const prices = Array.from(productCardData, (p) =>
        parsePrice(p.price || p.newPrice || p.oldPrice),
      );
      priceSlider.min = Math.min(...prices);
      priceSlider.max = Math.max(...prices);
      priceSlider.value = priceSlider.max;
      priceLabel.textContent = `Rs ${priceSlider.value}`;
    }

    renderProducts(productCardData);
  });
}

// Rating button behavior: click to set minimumRating and filter
function initRatingFilters() {
  const ratingBtns = document.querySelectorAll(
    ".filter-content.stars .rating-btn",
  );
  ratingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = Number(btn.getAttribute("data-rating")) || 0;
      // toggling: if same clicked again, clear selection
      if (minimumRating === r) {
        minimumRating = 0;
        ratingMax = Infinity;
      } else {
        minimumRating = r;
        ratingMax = r === 5 ? Infinity : r + 1;
      }

      // visuals: clear all then mark only the clicked button when selected
      ratingBtns.forEach((b) => b.classList.remove("active-star"));
      if (minimumRating) {
        btn.classList.add("active-star");
      }

      applyFilters();
    });
  });
}

initRatingFilters();

/* ===========================
   QUICK VIEW
=========================== */
function openQuickView(product) {
  document.querySelector(".quick-view-title").textContent = product.title;
  document.querySelector(".quick-view-price").textContent = product.newPrice;

  const image =
    Array.isArray(product.images) && product.images.length
      ? product.images[0]
      : product.productImage;

  document.querySelector(".quick-view-image").src = image || "";

  quickViewModal.classList.add("active");

  localStorage.setItem("selectedProduct", JSON.stringify(product));

  quickViewModal.classList.add("active");
}

// initial render
applyFilters();

document
  .querySelector(".cross-icon")
  ?.addEventListener("click", () => quickViewModal.classList.remove("active"));

/* ===========================
   NAVBAR SCROLL EFFECT
=========================== */
window.addEventListener("scroll", () => {
  document
    .querySelector(".navbar-container")
    ?.classList.toggle("scrolled-window", window.scrollY > 50);
});

/* ===========================
   INITIAL LOAD
=========================== */
applyFilters();

// SIDE bar MENU
window.showSideBar = () => {
  const sidebar = document.querySelector(".side-navbar-ul-tags-container");
  const filterPanel = document.querySelector(".vertical");
  // Close filter if open
  if (filterPanel.classList.contains("active")) {
    filterPanel.classList.remove("active");
    const toggleFilterBtn = document.querySelector(
      ".openFilter-button button .text",
    );
    if (toggleFilterBtn) toggleFilterBtn.textContent = "Filters";
  }
  sidebar.style.transform = "translateX(0)";
  document.body.style.overflow = "hidden"; // prevent background scroll
};

window.closeSideBar = () => {
  const sidebar = document.querySelector(".side-navbar-ul-tags-container");
  const overlayClose = document.querySelector(".overlay");
  sidebar.style.transform = "translateX(100%)";
  overlayClose.classList.remove("active");
  document.body.style.overflow = ""; // restore scrolling
};

window.showFilterPannel = () => {
  const filterPanel = document.querySelector(".vertical");
  const toggleFilterBtn = document.querySelector(
    ".openFilter-button button .text",
  );
  const sidebar = document.querySelector(".side-navbar-ul-tags-container");
  // Close sidebar if open
  if (sidebar.style.transform === "translateX(0px)") {
    sidebar.style.transform = "translateX(100%)";
  }
  // Toggle filter panel
  filterPanel.classList.toggle("active");
  if (filterPanel.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

window.closeFilterPanel = () => {
  const filterPanel = document.querySelector(".vertical");
  const overlay = document.querySelector(".overlay");
  const toggleFilterBtn = document.querySelector(
    ".openFilter-button button .text",
  );
  filterPanel.classList.remove("active");
  overlay.classList.remove("active"); // fixed variable name
  document.body.style.overflow = ""; // restore scrolling
  if (toggleFilterBtn) toggleFilterBtn.textContent = "Filters";
};
