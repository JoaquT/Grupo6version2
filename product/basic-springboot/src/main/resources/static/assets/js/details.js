/* ============================================================================
   BOOKMATE - LÓGICA DE PÁGINA DE DETALLE
   ============================================================================ */

let currentBook = null;

/**
 * Inicializar página de detalle
 */
document.addEventListener("DOMContentLoaded", async function () {
  const bookId = window.BookMate.getUrlParameter("id");

  if (!bookId) {
    showBookNotFound();
    return;
  }

  try {
    // Cargar libro
    currentBook = await window.BookMate.getBookById(bookId);

    if (!currentBook) {
      showBookNotFound();
      return;
    }

    // Renderizar detalles
    renderBookDetails();

    // Cargar libros similares
    await loadSimilarBooks();
  } catch (error) {
    console.error("Error al cargar detalle:", error);
    showError();
  }
});

/**
 * Renderizar detalles del libro
 */
/**
 * Renderizar detalles del libro
 */
function renderBookDetails() {
  // Ocultar loading
  document.getElementById("detailsLoading").style.display = "none";
  document.getElementById("bookDetails").style.display = "block";

  // Actualizar breadcrumb
  document.getElementById("breadcrumbTitle").textContent = currentBook.title;

  const coverContainer = document.getElementById("bookCoverLarge");

  // 1. Limpiar estilos del contenedor
  coverContainer.style.background = "transparent";
  coverContainer.style.backgroundColor = "transparent";
  coverContainer.style.backgroundImage = "none";
  coverContainer.style.padding = "0";
  coverContainer.style.border = "none";
  coverContainer.style.boxShadow = "none";

  // 2. Ajuste "Shrink-to-fit" (El div se encoge al tamaño de la imagen)
  coverContainer.style.width = "fit-content";
  coverContainer.style.height = "auto";
  coverContainer.style.margin = "0 auto"; // Centrado horizontal si sobra espacio

  // 3. Insertar la imagen limpia

  coverContainer.innerHTML = `
      <img src="${currentBook.cover}" 
           alt="${currentBook.title}" 
           class="img-fluid" 
           style="display: block; max-width: 100%; height: auto;"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/350x500?text=No+Disponible';">
  `;
  // ---------------------------------------------------

  // Título
  document.getElementById("bookTitle").textContent = currentBook.title;

  // Autor
  document.getElementById("bookAuthor").innerHTML = `
        <i class="fas fa-user"></i> Por ${currentBook.author}
    `;

  // Rating
  const stars = window.BookMate.generateStars(currentBook.rating);
  document.getElementById("bookRating").innerHTML = `
        ${stars} ${currentBook.rating.toFixed(1)} 
        <span class="text-muted">(${window.BookMate.formatNumber(
          currentBook.reviews_count
        )} reseñas)</span>
    `;

  // Año
  document.getElementById("bookYear").textContent =
    currentBook.year > 0 ? currentBook.year : "Antiguo";

  // Páginas
  document.getElementById("bookPages").textContent =
    window.BookMate.formatNumber(currentBook.pages);

  // Género (Manejo de múltiples géneros visualmente)
  document.getElementById("bookGenre").innerHTML = `
        <span class="badge-custom badge-genre">${currentBook.genre.replace(
          /,/g,
          ", "
        )}</span>
    `;

  // ISBN
  document.getElementById("bookISBN").textContent = currentBook.isbn;

  // Tags
  const tagsContainer = document.getElementById("bookTags");
  if (currentBook.tags && Array.isArray(currentBook.tags)) {
    tagsContainer.innerHTML = currentBook.tags
      .map((tag) => `<span class="badge-custom">${tag}</span>`)
      .join("");
  } else {
    tagsContainer.innerHTML = "";
  }

  // Synopsis
  document.getElementById("bookSynopsis").textContent = currentBook.synopsis;

  // Renderizar botones de acción
  renderBookActions();

  // Actualizar título de página
  document.title = `${currentBook.title} - BookMate`;
}
/**
 * Renderizar botones de acción según estado de autenticación
 */
function renderBookActions() {
  const container = document.getElementById("bookActionsContainer");

  if (!container) return;

  // Usar la función global de library.js
  if (window.updateBookDetailUI) {
    window.updateBookDetailUI(currentBook.id);
  }
}

/**
 * Cargar libros similares
 */
/**
 * Cargar libros similares
 */
async function loadSimilarBooks() {
  const container = document.getElementById("similarBooksGrid");
  const loading = document.getElementById("similarBooksLoading");

  loading.style.display = "block";

  try {
    const allBooks = await window.BookMate.loadBooks();

    // Preparar géneros del libro actual (Array separado)
    const currentGenres = currentBook.genre
      ? currentBook.genre.split(",").map((g) => g.trim())
      : [];

    // Filtrar libros
    let similarBooks = allBooks.filter((book) => {
      // 1. Excluir el libro actual
      if (book.id === currentBook.id) return false;

      // 2. Coincidencia por Autor (Prioridad alta)
      if (book.author === currentBook.author) return true;

      // 3. Coincidencia por Género
      if (book.genre) {
        const bookGenres = book.genre.split(",").map((g) => g.trim());
        // Verificar intersección de arrays
        const hasCommonGenre = bookGenres.some((g) =>
          currentGenres.includes(g)
        );
        return hasCommonGenre;
      }

      return false;
    });

    // Ordenar por rating y limitar a 6
    similarBooks = similarBooks.sort((a, b) => b.rating - a.rating).slice(0, 6);

    loading.style.display = "none";

    if (similarBooks.length === 0) {
      container.innerHTML = `
                <div class="col-12 text-center py-4">
                    <p class="text-muted">No se encontraron libros similares.</p>
                </div>
            `;
      return;
    }

    // Renderizar libros similares
    container.innerHTML = similarBooks
      .map((book) => window.BookMate.createBookCard(book))
      .join("");
  } catch (error) {
    console.error("Error al cargar libros similares:", error);
    loading.style.display = "none";
    container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar libros similares.
                </div>
            </div>
        `;
  }
}

/**
 * Mostrar mensaje de libro no encontrado
 */
function showBookNotFound() {
  document.getElementById("detailsLoading").style.display = "none";
  document.getElementById("bookNotFound").style.display = "block";
  document.title = "Libro no encontrado - BookMate";
}

/**
 * Mostrar error general
 */
function showError() {
  const loading = document.getElementById("detailsLoading");
  loading.innerHTML = `
        <div class="alert alert-danger alert-custom">
            <i class="fas fa-exclamation-triangle"></i>
            Error al cargar el libro. Por favor, intenta nuevamente.
        </div>
        <div class="text-center mt-3">
            <a href="catalog.html" class="btn btn-primary-custom">
                <i class="fas fa-arrow-left"></i> Volver al Catálogo
            </a>
        </div>
    `;
}
