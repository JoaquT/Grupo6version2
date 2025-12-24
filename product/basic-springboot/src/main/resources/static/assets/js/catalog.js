/* ============================================================================
   BOOKMATE - LÓGICA DEL CATÁLOGO
   ============================================================================ */

// Estado del catálogo
const catalogState = {
  allBooks: [],
  filteredBooks: [],
  currentPage: 1,
  booksPerPage: 9,
  selectedGenres: [],
  searchTerm: "",
  yearRange: "",
  pagesRange: "",
  sortBy: "rating-desc",
};

function normalizeText(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Inicializar catálogo al cargar la página
 */
document.addEventListener("DOMContentLoaded", async function () {
  console.log(">>> CATALOG.JS CARGADO CON NORMALIZACIÓN <<<"); // Debug
  try {
    // Cargar libros
    catalogState.allBooks = await window.BookMate.loadBooks();
    catalogState.filteredBooks = [...catalogState.allBooks];

    // Inicializar UI
    initializeGenreFilters();
    initializeEventListeners();

    // Renderizar catálogo
    renderCatalog();
  } catch (error) {
    showError("Error al cargar el catálogo. Por favor, recarga la página.");
  }
});

/**
 * Inicializar filtros de género
 */
function initializeGenreFilters() {
  const genresSet = new Set();

  catalogState.allBooks.forEach((book) => {
    if (book.genre) {
      // "Ficción, Terror" -> ["Ficción", "Terror"]
      const splitGenres = book.genre.split(",").map((g) => g.trim());
      splitGenres.forEach((g) => genresSet.add(g));
    }
  });

  const genres = [...genresSet].sort();
  const container = document.getElementById("genreFilters");

  container.innerHTML = genres
    .map(
      (genre) => `
        <div class="form-check genre-checkbox">
            <input class="form-check-input" type="checkbox" value="${genre}" id="genre-${genre.replace(
        /\s+/g,
        "-"
      )}">
            <label class="form-check-label" for="genre-${genre.replace(
              /\s+/g,
              "-"
            )}">
                ${genre}
            </label>
        </div>
    `
    )
    .join("");

  // Reasignar listeners
  const genreCheckboxes = document.querySelectorAll(
    '#genreFilters input[type="checkbox"]'
  );
  genreCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleGenreFilter);
  });
}

/**
 * Inicializar event listeners
 */
function initializeEventListeners() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", debounce(handleSearch, 300));

  document
    .getElementById("yearFilter")
    .addEventListener("change", handleYearFilter);
  document
    .getElementById("pagesFilter")
    .addEventListener("change", handlePagesFilter);
  document.getElementById("sortBy").addEventListener("change", handleSort);
  document
    .getElementById("clearFilters")
    .addEventListener("click", clearAllFilters);
}

/**
 * Manejar búsqueda (NORMALIZANDO)
 */
function handleSearch(event) {
  // Guardamos el término tal cual, la normalización se hace en applyFilters
  catalogState.searchTerm = event.target.value;
  catalogState.currentPage = 1;
  applyFilters();
}

function handleGenreFilter() {
  const checkboxes = document.querySelectorAll(
    '#genreFilters input[type="checkbox"]:checked'
  );
  catalogState.selectedGenres = Array.from(checkboxes).map((cb) => cb.value);
  catalogState.currentPage = 1;
  applyFilters();
}

function handleYearFilter(event) {
  catalogState.yearRange = event.target.value;
  catalogState.currentPage = 1;
  applyFilters();
}

function handlePagesFilter(event) {
  catalogState.pagesRange = event.target.value;
  catalogState.currentPage = 1;
  applyFilters();
}

function handleSort(event) {
  catalogState.sortBy = event.target.value;
  applyFilters();
}

/**
 * APLICAR FILTROS
 */
/**
 * APLICAR FILTROS (BÚSQUEDA INTELLIGENTE / CONTEXTUAL)
 */
function applyFilters() {
  let books = [...catalogState.allBooks];

  if (catalogState.searchTerm) {
    const term = normalizeText(catalogState.searchTerm);

    books = books.filter((book) => {
      // 1. Preparamos todos los campos donde queremos buscar
      const title = normalizeText(book.title);
      const author = normalizeText(book.author);
      const genre = normalizeText(book.genre);
      const synopsis = normalizeText(book.synopsis);

      // Convertimos los tags (array) en un solo texto para buscar dentro
      const tags = book.tags ? normalizeText(book.tags.join(" ")) : "";

      // 2. Comprobamos si el término existe en ALGUNO de esos campos
      return (
        title.includes(term) ||
        author.includes(term) ||
        genre.includes(term) ||
        tags.includes(term) ||
        synopsis.includes(term)
      );
    });
  }

  // 2. FILTRO DE GÉNERO (MULTIGÉNERO)
  if (catalogState.selectedGenres.length > 0) {
    books = books.filter((book) => {
      if (!book.genre) return false;
      const bookGenres = book.genre.split(",").map((g) => g.trim());
      return catalogState.selectedGenres.some((selected) =>
        bookGenres.includes(selected)
      );
    });
  }

  // 3. Filtros numéricos (Año)
  if (catalogState.yearRange) {
    books = books.filter((book) => {
      const year = book.year;
      switch (catalogState.yearRange) {
        case "2020-2024":
          return year >= 2020 && year <= 2024;
        case "2010-2019":
          return year >= 2010 && year <= 2019;
        case "2000-2009":
          return year >= 2000 && year <= 2009;
        case "1990-1999":
          return year >= 1990 && year <= 1999;
        case "1900-1989":
          return year >= 1900 && year <= 1989;
        case "ancient":
          return year < 1900;
        default:
          return true;
      }
    });
  }

  // 4. Filtros numéricos (Páginas)
  if (catalogState.pagesRange) {
    books = books.filter((book) => {
      const pages = book.pages;
      switch (catalogState.pagesRange) {
        case "0-200":
          return pages < 200;
        case "200-400":
          return pages >= 200 && pages <= 400;
        case "400-600":
          return pages >= 400 && pages <= 600;
        case "600+":
          return pages > 600;
        default:
          return true;
      }
    });
  }

  // Ordenamiento
  books = sortBooks(books, catalogState.sortBy);

  catalogState.filteredBooks = books;
  renderCatalog();
}

/**
 * Ordenar libros
 */
function sortBooks(books, sortBy) {
  const sorted = [...books];
  switch (sortBy) {
    case "rating-desc":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "rating-asc":
      return sorted.sort((a, b) => a.rating - b.rating);
    case "year-desc":
      return sorted.sort((a, b) => b.year - a.year);
    case "year-asc":
      return sorted.sort((a, b) => a.year - b.year);
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
}

function clearAllFilters() {
  document.getElementById("searchInput").value = "";
  catalogState.searchTerm = "";
  document
    .querySelectorAll('#genreFilters input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));
  catalogState.selectedGenres = [];
  document.getElementById("yearFilter").value = "";
  catalogState.yearRange = "";
  document.getElementById("pagesFilter").value = "";
  catalogState.pagesRange = "";
  document.getElementById("sortBy").value = "rating-desc";
  catalogState.sortBy = "rating-desc";
  catalogState.currentPage = 1;
  applyFilters();
}

function renderCatalog() {
  const loading = document.getElementById("catalogLoading");
  const grid = document.getElementById("booksGrid");
  const noResults = document.getElementById("noResults");
  const paginationContainer = document.getElementById("paginationContainer");

  loading.style.display = "none";
  updateResultsCount();

  if (catalogState.filteredBooks.length === 0) {
    grid.style.display = "none";
    paginationContainer.style.display = "none";
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";
  grid.style.display = "flex";

  const startIndex = (catalogState.currentPage - 1) * catalogState.booksPerPage;
  const endIndex = startIndex + catalogState.booksPerPage;
  const booksToShow = catalogState.filteredBooks.slice(startIndex, endIndex);

  grid.innerHTML = booksToShow
    .map((book) => window.BookMate.createBookCard(book))
    .join("");
  renderPagination();
}

function updateResultsCount() {
  const count = catalogState.filteredBooks.length;
  const total = catalogState.allBooks.length;
  document.getElementById(
    "resultsCount"
  ).textContent = `Mostrando ${count} de ${total} libros`;
}

function renderPagination() {
  const container = document.getElementById("paginationContainer");
  const totalPages = Math.ceil(
    catalogState.filteredBooks.length / catalogState.booksPerPage
  );

  if (totalPages <= 1) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";
  const pagination = container.querySelector(".pagination");
  const currentPage = catalogState.currentPage;

  let paginationHTML = "";

  // Botón anterior
  paginationHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${
              currentPage - 1
            }); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

  // Números
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      paginationHTML += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
                </li>
            `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  // Botón siguiente
  paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${
              currentPage + 1
            }); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

  pagination.innerHTML = paginationHTML;
}

function changePage(page) {
  const totalPages = Math.ceil(
    catalogState.filteredBooks.length / catalogState.booksPerPage
  );
  if (page < 1 || page > totalPages) return;
  catalogState.currentPage = page;
  renderCatalog();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showError(message) {
  const loading = document.getElementById("catalogLoading");
  loading.innerHTML = `<div class="alert alert-danger alert-custom"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

window.changePage = changePage;
