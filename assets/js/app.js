// assets/js/app.js
// Requisitos cubiertos:
// 1) Carga dinámica de secciones desde /assets/data/*.json
// 2) Menú desktop y móvil se generan desde los mismos datos
// 3) Errores con trazabilidad (muestra URL, HTTP status y detalle de parseo)
// 4) Tolera BOM en JSON (causa común de "error fantasma" en Windows)
// 5) Contenido de cada sección reemplazable editando SOLO el JSON (bodyHtml)

// ==============================
// 1. Configuración
// ==============================
const RutaData = "/assets/data/";

// Para depurar: deja SOLO 1 archivo.
// Cuando funcione, agrega los demás.
const ArchivosSecciones = [
  "classmate1.json",
  "classmate2.json",
  "classmate3.json",
  "classmate4.json",
  "classmate5.json",
  "classmate6.json",
  "classmate7.json",
];

// ==============================
// 2. Referencias DOM
// ==============================
const NavLinks = document.getElementById("nav-links");
const MobileNavLinks = document.getElementById("mobile-nav-links");
const SectionsContainer = document.getElementById("sections-container");

const MobileBtn = document.getElementById("mobile-menu-btn");
const MobileMenu = document.getElementById("mobile-menu");

// ==============================
// 3. Utilidades
// ==============================
function EscaparHtml(Texto) {
  return String(Texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function RequerirCampo(Obj, Campo, NombreArchivo) {
  if (!Obj || typeof Obj !== "object") {
    throw new Error(`JSON no es un objeto en ${NombreArchivo}.`);
  }
  if (!(Campo in Obj)) {
    throw new Error(`Falta el campo obligatorio "${Campo}" en ${NombreArchivo}.`);
  }
}

function LimpiarBOM(Texto) {
  return String(Texto).replace(/^\uFEFF/, "");
}

// ==============================
// 4. Carga robusta de JSON (con trazabilidad)
// ==============================
async function CargarJson(NombreArchivo) {
  const Url = `${RutaData}${NombreArchivo}`;

  console.log("Intentando cargar:", Url);

  const Respuesta = await fetch(Url, { cache: "no-store" });

  console.log("Estado HTTP:", Respuesta.status, Respuesta.statusText, "->", Url);

  const Texto = await Respuesta.text();

  if (!Respuesta.ok) {
    throw new Error(
      `HTTP ${Respuesta.status} al cargar ${Url}. Inicio de respuesta: ${Texto.slice(0, 160)}`
    );
  }

  try {
    const TextoSinBOM = LimpiarBOM(Texto);
    return JSON.parse(TextoSinBOM);
  } catch (ErrorParseo) {
    throw new Error(
      `JSON inválido en ${Url}. ${ErrorParseo.message}. Inicio: ${Texto.slice(0, 220)}`
    );
  }
}

// ==============================
// 5. Render de menú y secciones
// ==============================
function HtmlNavItem(Seccion) {
  const Id = EscaparHtml(Seccion.id);
  const TituloMenu = EscaparHtml(Seccion.menuText);
  const Icono = EscaparHtml(Seccion.menuIcon); // ej: "fa-book-open"

  return `
    <li>
      <a href="#${Id}" class="nav-item hover:text-secondary transition-colors duration-300 font-medium text-sm">
        <i class="fas ${Icono} w-6 text-center mr-2"></i> ${TituloMenu}
      </a>
    </li>
  `;
}

function HtmlMobileNavItem(Seccion) {
  const Id = EscaparHtml(Seccion.id);
  const TituloMenu = EscaparHtml(Seccion.menuText);
  return `<li><a href="#${Id}" class="mobile-link">${TituloMenu}</a></li>`;
}

// Plantilla única de sección (card)
function HtmlSectionCard(Seccion) {
  const Id = EscaparHtml(Seccion.id);
  const Etiqueta = EscaparHtml(Seccion.label);
  const Titulo = EscaparHtml(Seccion.title);

  // Ejemplos válidos: "blue-600", "purple-700", etc.
  // Deben existir en Tailwind; si escriben algo raro, se verá sin el gradiente esperado.
  const From = EscaparHtml(Seccion.headerGradientFrom);
  const To = EscaparHtml(Seccion.headerGradientTo);

  // El cuerpo viene como HTML controlado desde JSON
  const BodyHtml = Seccion.bodyHtml || "";

  return `
    <section id="${Id}" class="mb-24 reveal pt-12">
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300">
        <div class="bg-gradient-to-r from-${From} to-${To} p-6 text-white">
          <span class="text-xs font-bold uppercase tracking-wider opacity-80">${Etiqueta}</span>
          <h2 class="text-3xl font-bold mt-1">${Titulo}</h2>
        </div>
        <div class="p-8">
          ${BodyHtml}
        </div>
      </div>
    </section>
  `;
}

// ==============================
// 6. Interacciones UI
// ==============================
function ActivarMenuMovil() {
  if (!MobileBtn || !MobileMenu) return;

  MobileBtn.addEventListener("click", () => {
    MobileMenu.classList.toggle("hidden");
  });

  if (MobileNavLinks) {
    MobileNavLinks.addEventListener("click", (Evento) => {
      const EsLink = Evento.target && Evento.target.matches("a.mobile-link");
      if (EsLink) {
        MobileMenu.classList.add("hidden");
      }
    });
  }
}

function ActivarRevealOnScroll() {
  const RevealElements = document.querySelectorAll(".reveal");
  if (!RevealElements.length) return;

  const RevealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px",
  };

  const RevealOnScroll = new IntersectionObserver((Entries, Observer) => {
    Entries.forEach((Entry) => {
      if (!Entry.isIntersecting) return;
      Entry.target.classList.add("active");
      Observer.unobserve(Entry.target);
    });
  }, RevealOptions);

  RevealElements.forEach((El) => RevealOnScroll.observe(El));
}

function ActivarResaltadoNav() {
  const Sections = document.querySelectorAll("section");
  const NavItems = document.querySelectorAll(".nav-item");
  if (!Sections.length || !NavItems.length) return;

  window.addEventListener("scroll", () => {
    let Current = "";
    Sections.forEach((Section) => {
      const SectionTop = Section.offsetTop;
      if (scrollY >= (SectionTop - 200)) {
        Current = Section.getAttribute("id");
      }
    });

    NavItems.forEach((Item) => {
      Item.classList.remove("text-secondary", "font-bold");
      if (Item.getAttribute("href") === `#${Current}`) {
        Item.classList.add("text-secondary", "font-bold");
      }
    });
  });
}

// ==============================
// 7. Validación mínima de cada JSON
// ==============================
function ValidarSeccion(Seccion, NombreArchivo) {
  const Campos = [
    "id",
    "menuText",
    "menuIcon",
    "label",
    "title",
    "headerGradientFrom",
    "headerGradientTo",
    // bodyHtml es opcional
  ];

  Campos.forEach((Campo) => RequerirCampo(Seccion, Campo, NombreArchivo));

  // Validaciones básicas (evita errores silenciosos)
  if (!String(Seccion.id).trim()) {
    throw new Error(`El campo "id" está vacío en ${NombreArchivo}.`);
  }
  if (!String(Seccion.menuIcon).startsWith("fa-")) {
    console.warn(
      `Advertencia: "menuIcon" en ${NombreArchivo} no inicia con "fa-". Valor:`,
      Seccion.menuIcon
    );
  }
}

// ==============================
// 8. Orquestación
// ==============================
async function Renderizar() {
  if (!NavLinks || !MobileNavLinks || !SectionsContainer) {
    throw new Error(
      'No se encontraron contenedores en el DOM. Revisa que existan: #nav-links, #mobile-nav-links, #sections-container.'
    );
  }

  const Secciones = [];

  for (const Archivo of ArchivosSecciones) {
    const Data = await CargarJson(Archivo);
    ValidarSeccion(Data, Archivo);
    Secciones.push(Data);
  }

  // Menús
  NavLinks.innerHTML = Secciones.map(HtmlNavItem).join("");
  MobileNavLinks.innerHTML = Secciones.map(HtmlMobileNavItem).join("");

  // Secciones
  SectionsContainer.innerHTML = Secciones.map(HtmlSectionCard).join("");

  // Activar UI
  ActivarMenuMovil();
  ActivarRevealOnScroll();
  ActivarResaltadoNav();
}

Renderizar().catch((Error) => {
  console.error("Fallo renderizando:", Error);

  if (SectionsContainer) {
    SectionsContainer.innerHTML = `
      <div class="p-6 bg-red-50 border border-red-200 rounded-xl">
        <p class="font-bold text-red-700">Error cargando contenido.</p>
        <p class="text-red-700 text-sm mt-2">${EscaparHtml(Error.message)}</p>
        <p class="text-red-700 text-xs mt-3">Abre F12 → Console/Network para ver la URL exacta.</p>
      </div>
    `;
  }
});