/**
 * STREET STYLE - Scroll Depth Animation & Performance Optimization
 * 
 * This script implements a performant scroll-driven animation system using:
 * - IntersectionObserver for efficient element visibility detection
 * - requestAnimationFrame for smooth, jank-free animations
 * - Reduced motion preference respect for accessibility
 * 
 * Performance approach: Instead of listening to scroll events (which fire
 * hundreds of times per second), we use IntersectionObserver which is
 * hardware-accelerated and only triggers when elements enter/exit viewport.
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        observerThreshold: 0.1, // Trigger when 10% of element is visible
        observerRootMargin: '0px 0px -100px 0px', // Trigger slightly before element enters
        animationDelayStep: 80, // Milliseconds between staggered animations
        reducedMotionQuery: '(prefers-reduced-motion: reduce)'
    };

    // ============================================
    // State
    // ============================================
    let observer = null;
    let animationFrameId = null;
    let isReducedMotion = false;

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Check if user prefers reduced motion
     * @returns {boolean} True if reduced motion is preferred
     */
    function checkReducedMotion() {
        return window.matchMedia(CONFIG.reducedMotionQuery).matches;
    }

    /**
     * Debounce function to limit execution rate
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
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

    /**
     * Animate product card with stagger effect
     * @param {HTMLElement} card - Product card element
     * @param {number} index - Card index for staggering
     */
    function animateCard(card, index) {
        if (isReducedMotion) {
            // Instant visibility for reduced motion preference
            card.classList.add('is-visible');
            return;
        }

        // Use requestAnimationFrame for smooth animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
            // Add stagger delay based on index
            setTimeout(() => {
                card.classList.add('is-visible');
                
                // Remove will-change after animation completes to free up memory
                setTimeout(() => {
                    card.style.willChange = 'auto';
                }, 600); // Match CSS transition duration
            }, index * CONFIG.animationDelayStep);
        });
    }

    /**
     * Handle intersection observer entries
     * @param {IntersectionObserverEntry[]} entries - Observer entries
     */
    function handleIntersection(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const card = entry.target;
                
                // Only animate once
                if (!card.classList.contains('is-visible')) {
                    animateCard(card, index);
                    
                    // Unobserve after animation to improve performance
                    if (observer) {
                        observer.unobserve(card);
                    }
                }
            }
        });
    }

    // ============================================
    // Core Functions
    // ============================================

    /**
     * Initialize IntersectionObserver for scroll animations
     */
    function initScrollAnimation() {
        // Check for reduced motion preference
        isReducedMotion = checkReducedMotion();

        // Get all product cards with data-scroll attribute
        const productCards = document.querySelectorAll('[data-scroll]');
        
        if (productCards.length === 0) {
            console.log('[STREET STYLE] No product cards found for animation');
            return;
        }

        console.log(`[STREET STYLE] Initializing scroll animation for ${productCards.length} cards`);

        // Create IntersectionObserver with optimized options
        observer = new IntersectionObserver(handleIntersection, {
            threshold: CONFIG.observerThreshold,
            rootMargin: CONFIG.observerRootMargin,
            root: null // Use viewport as root
        });

        // Observe each product card
        productCards.forEach(card => {
            // Set initial will-change for smoother animation
            if (!isReducedMotion) {
                card.style.willChange = 'transform, opacity';
            }
            observer.observe(card);
        });

        // Listen for changes in reduced motion preference
        window.matchMedia(CONFIG.reducedMotionQuery).addEventListener('change', (e) => {
            isReducedMotion = e.matches;
            console.log(`[STREET STYLE] Reduced motion preference changed: ${isReducedMotion}`);
            
            // If switching to reduced motion, instantly show all visible cards
            if (isReducedMotion) {
                productCards.forEach(card => {
                    card.classList.add('is-visible');
                    card.style.willChange = 'auto';
                });
            }
        });
    }

    /**
     * Initialize smooth scroll for anchor links
     */
    function initSmoothScroll() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Skip if it's just "#"
                if (href === '#') return;
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    
                    // Calculate offset for fixed header
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: isReducedMotion ? 'auto' : 'smooth'
                    });
                }
            });
        });
    }

    /**
     * Lazy load images with native loading="lazy" fallback
     */
    function initLazyLoading() {
        // Modern browsers handle loading="lazy" natively
        // This is a fallback for better error handling
        
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        images.forEach(img => {
            img.addEventListener('error', () => {
                console.warn(`[STREET STYLE] Failed to load image: ${img.src}`);
                // Could add fallback image here
                img.alt = 'Бүтээгдэхүүний зураг ачаалагдахад алдаа гарлаа';
            });
        });
    }

    /**
     * Add keyboard navigation enhancements
     */
    function initKeyboardNavigation() {
        // Add skip link functionality
        const skipLink = document.createElement('a');
        skipLink.href = '#products';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Үндсэн агуулга руу шилжих';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Handle keyboard focus for product cards
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'article');
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const link = card.querySelector('.product-link');
                    if (link) {
                        e.preventDefault();
                        link.click();
                    }
                }
            });
        });
    }

    /**
     * Performance monitoring (development only)
     */
    function monitorPerformance() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.entryType === 'largest-contentful-paint') {
                            console.log(`[STREET STYLE] LCP: ${entry.startTime.toFixed(2)}ms`);
                        }
                        if (entry.entryType === 'first-input') {
                            console.log(`[STREET STYLE] FID: ${entry.processingStart - entry.startTime}ms`);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
            } catch (e) {
                console.log('[STREET STYLE] Performance monitoring not supported');
            }
        }
    }

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize all functionality when DOM is ready
     */
    function init() {
        console.log('[STREET STYLE] Initializing...');
        
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initScrollAnimation();
                initSmoothScroll();
                initLazyLoading();
                initKeyboardNavigation();
                monitorPerformance();
                console.log('[STREET STYLE] Initialization complete');
            });
        } else {
            initScrollAnimation();
            initSmoothScroll();
            initLazyLoading();
            initKeyboardNavigation();
            monitorPerformance();
            console.log('[STREET STYLE] Initialization complete');
        }
    }

    // Start initialization
    init();

})();
