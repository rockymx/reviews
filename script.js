// ========================================================================
// SCRIPT COMPLETO - script.js
// Incluye:
// - Lógica de Calificación por Estrellas
// - Internacionalización (i18n) con carga de JSON
// - Generación dinámica de botones de acción
// - Corrección del error 'stars is not defined'
// -- SEGUIMIENTO DE EVENTOS LITLYX ELIMINADO --
// ========================================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- Elementos DOM ---
    const stars = document.querySelectorAll('.stars i');
    const ratingText = document.querySelector('.rating-text');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackMessage = document.getElementById('feedback-message');
    const actionButtons = document.getElementById('action-buttons');
    const langToggleButton = document.getElementById('lang-toggle'); // Botón para cambiar idioma
    const currentLangIndicator = document.getElementById('current-lang-indicator'); // Muestra idioma actual

    // --- Configuración i18n (Internacionalización) ---
    const availableLangs = ['es', 'en']; // Idiomas disponibles
    let storedLang = localStorage.getItem('language');
    let currentLang = (storedLang && availableLangs.includes(storedLang)) ? storedLang : 'es';
    let translations = {}; // Almacenará las traducciones cargadas

    // --- URLs (Reemplaza con tus URLs reales) ---
    const formURL = 'https://share.deftform.com/NH6QNN'; // URL para feedback <= 3 estrellas
    const googleMapsURL = 'https://search.google.com/local/writereview?placeid=ChIJpb5ueVulK4EREAjn8iHN-n8'; // URL reseña Google
    const facebookPageURL = 'https://www.facebook.com/profile.php?id=61575501932738&sk=reviews'; // URL reseña Facebook

    // --- Variables de Estado ---
    let currentRating = 0; // Almacena la calificación seleccionada

    // ========================================================================
    // FUNCIONES DE TRADUCCIÓN (i18n)
    // ========================================================================

    async function loadTranslations(lang) {
        console.log(`Intentando cargar traducciones para: ${lang}`);
        if (!availableLangs.includes(lang)) {
            console.error(`Error Interno: Idioma inválido solicitado ${lang}. Volviendo a 'es'.`);
            lang = 'es';
            currentLang = 'es';
            localStorage.setItem('language', currentLang);
        }

        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status} al cargar locales/${lang}.json`);
            }
            translations = await response.json();
            console.log(`Traducciones cargadas exitosamente para: ${lang}`);
            applyTranslations(lang);
        } catch (error) {
            console.error(`FALLO al cargar/procesar traducciones para ${lang}:`, error);
            if (lang !== 'es') {
                console.warn("Intentando cargar idioma por defecto 'es' como fallback.");
                try {
                    const fallbackResponse = await fetch('locales/es.json');
                    if (!fallbackResponse.ok) throw new Error(`Error HTTP ${fallbackResponse.status} al cargar fallback locales/es.json`);
                    translations = await fallbackResponse.json();
                    currentLang = 'es';
                    localStorage.setItem('language', currentLang);
                    console.log("Traducciones de fallback 'es' cargadas.");
                    applyTranslations(currentLang);
                } catch (fallbackError) {
                    console.error("FALLO CRÍTICO: No se pudo cargar ni el idioma solicitado ni el fallback 'es'.", fallbackError);
                }
            }
        }
    }

    function applyTranslations(lang) {
        console.log(`Aplicando traducciones para: ${lang}`);
        if (Object.keys(translations).length === 0) {
            console.warn("No hay traducciones cargadas para aplicar.");
            return;
        }

        document.documentElement.lang = lang;
        if (currentLangIndicator) {
            currentLangIndicator.textContent = lang.toUpperCase();
        } else {
            console.warn("Elemento #current-lang-indicator no encontrado.");
        }

        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[key] !== undefined) {
                if (key === 'footerCopyright' && translations[key].includes('<')) {
                     el.innerHTML = translations[key];
                } else {
                     el.textContent = translations[key];
                }
            } else {
                console.warn(`Traducción faltante para [data-translate="${key}"] en ${lang}.json`);
            }
        });

        document.querySelectorAll('[data-translate-content]').forEach(el => {
            const key = el.getAttribute('data-translate-content');
            const elementDescription = el.tagName === 'META' ? el.getAttribute('name') : key;
            if (translations[key] !== undefined) {
                el.setAttribute('content', translations[key]);
            } else {
                console.warn(`Traducción faltante para [data-translate-content="${key}"] (${elementDescription}) en ${lang}.json`);
            }
        });

        document.querySelectorAll('[data-translate-aria]').forEach(el => {
            const key = el.getAttribute('data-translate-aria');
            if (translations[key] !== undefined) {
                el.setAttribute('aria-label', translations[key]);
            } else {
                console.warn(`Traducción faltante para [data-translate-aria="${key}"] en ${lang}.json`);
            }
        });

        document.querySelectorAll('[data-translate-aria-pattern]').forEach(el => {
            const key = el.getAttribute('data-translate-aria-pattern');
            const ratingValue = el.getAttribute('data-rating');
            if (translations[key] !== undefined && ratingValue) {
                try {
                    const label = translations[key].replace('{rating}', ratingValue);
                    el.setAttribute('aria-label', label);
                } catch(e) {
                    console.error(`Error al reemplazar patrón para [data-translate-aria-pattern="${key}"]: ${e}`);
                    el.setAttribute('aria-label', translations[key]);
                }
            } else if (!translations[key]) {
                console.warn(`Traducción faltante para [data-translate-aria-pattern="${key}"] en ${lang}.json`);
            }
        });

        if (translations.pageTitle) {
            document.title = translations.pageTitle;
        } else {
             console.warn(`Traducción faltante para "pageTitle" en ${lang}.json`);
        }

        if (translations.changeLangAria && langToggleButton) {
            langToggleButton.setAttribute('aria-label', translations.changeLangAria);
            langToggleButton.setAttribute('title', translations.changeLangAria);
        } else if (!translations.changeLangAria) {
             console.warn(`Traducción faltante para "changeLangAria" en ${lang}.json`);
        }

        if (currentRating > 0) {
            console.log("Re-aplicando feedback para la nueva lengua.");
            showFeedback(currentRating);
        } else {
            if(ratingText && translations.selectRating) {
                ratingText.textContent = translations.selectRating;
            } else if (!translations.selectRating) {
                console.warn(`Traducción faltante para "selectRating" en ${lang}.json`);
            }
        }
        console.log(`Traducciones aplicadas para: ${lang}`);
    }

    function cycleLanguage() {
        console.log("Cambiando idioma...");
        const currentIndex = availableLangs.indexOf(currentLang);
        const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % availableLangs.length;
        currentLang = availableLangs[nextIndex];
        localStorage.setItem('language', currentLang);
        console.log(`Nuevo idioma seleccionado: ${currentLang}`);
        loadTranslations(currentLang);
    }

    // ========================================================================
    // FUNCIONES DE LA LÓGICA DE RESEÑAS
    // ========================================================================

    function highlightStars(rating) {
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            star.classList.toggle('active', starRating <= rating);
        });
    }

    function updateRatingText(rating) {
        if (!ratingText) return;

        if (rating > 0) {
            const patternKey = 'starAriaLabel';
            const pattern = translations[patternKey] || "{rating} star(s)";
            try {
                ratingText.textContent = pattern.replace('{rating}', rating);
            } catch (e) {
                console.error(`Error al reemplazar patrón en updateRatingText: ${e}`);
                ratingText.textContent = `${rating} star(s)`;
            }
        } else {
            ratingText.textContent = translations.selectRating || 'Select a rating';
        }
    }

    function showFeedback(rating) {
        console.log(`Mostrando feedback para rating: ${rating}`);
        if (Object.keys(translations).length === 0) {
            console.error("Feedback no puede mostrarse: ¡Traducciones no disponibles!");
            return;
        }
        if (!feedbackContainer || !feedbackMessage || !actionButtons) {
             console.error("Elementos de feedback no encontrados en el DOM.");
             return;
        }

        const feedbackKey = `feedback${rating}`;
        if (translations[feedbackKey] !== undefined) {
            feedbackMessage.textContent = translations[feedbackKey];
        } else {
            console.warn(`Traducción faltante para "${feedbackKey}" en ${currentLang}.json`);
            feedbackMessage.textContent = `Thank you for your feedback!`;
        }

        feedbackMessage.className = 'feedback-message';
        feedbackMessage.classList.add(rating <= 3 ? 'negative-feedback' : 'positive-feedback');

        actionButtons.innerHTML = '';

        // --- Función para crear botones DINÁMICOS ---
        const createButton = (href, target, rel, className, iconClass, translationKey, fallbackText) => {
            const button = document.createElement('a');
            button.href = href;
            if (target) button.target = target;
            if (rel) button.rel = rel;
            button.className = className;
            const buttonText = translations[translationKey] || fallbackText;
            button.innerHTML = `<i class="${iconClass}"></i> ${buttonText}`;
            actionButtons.appendChild(button);
        };
        // ---------------------------------------------------------------

        if (rating <= 3) {
            createButton(formURL, '_self', 'noopener noreferrer', 'btn btn-primary', 'fas fa-clipboard-list', 'completeFormBtn', 'Complete form');
        } else {
            createButton(googleMapsURL, '_self', 'noopener noreferrer', 'btn btn-google', 'fab fa-google', 'rateGoogleBtn', 'Rate us on Google');
            createButton(facebookPageURL, '_self', 'noopener noreferrer', 'btn btn-facebook', 'fab fa-facebook-f', 'rateFacebookBtn', 'Rate us on Facebook');
        }

        feedbackContainer.classList.remove('hidden');
        setTimeout(() => {
            feedbackContainer.classList.add('visible');
        }, 10);
    }

    // ========================================================================
    // MANEJADORES DE EVENTOS PRINCIPALES
    // ========================================================================

    if (langToggleButton) {
        langToggleButton.addEventListener('click', function() {
            cycleLanguage();
            // El seguimiento de Litlyx para 'click_toggle_language' ha sido eliminado.
        });
    } else {
        console.error("CRÍTICO: Botón de cambio de idioma #lang-toggle no encontrado en el DOM.");
    }

    if (stars.length > 0) {
        stars.forEach(star => {
            star.addEventListener('mouseenter', function() {
                const rating = this.getAttribute('data-rating');
                highlightStars(rating);
            });

            star.addEventListener('mouseleave', function() {
                highlightStars(currentRating);
            });

            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                if (currentRating === rating) {
                    // Opcional: Deseleccionar
                } else {
                    currentRating = rating;
                    highlightStars(rating);
                    updateRatingText(rating);
                    showFeedback(rating);
                    // El seguimiento de Litlyx para 'select_rating' ha sido eliminado.
                }
            });

            star.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.click();
                }
            });
        });
    } else {
         console.warn("No se encontraron elementos '.stars i' para añadir listeners de estrellas.");
    }

    // ========================================================================
    // INICIALIZACIÓN AL CARGAR LA PÁGINA
    // ========================================================================
    console.log(`Idioma inicial detectado/seleccionado: ${currentLang}`);
    loadTranslations(currentLang);

}); // Fin del DOMContentLoaded
