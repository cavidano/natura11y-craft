import { delegateEvent } from './utilities/eventDelegation';
import { getFocusableElements } from './utilities/focus';

export default class Track {

    // Private properties

    #trackList = document.querySelectorAll('.track');
    #scrollTimeout = null;

    // Private methods
    
    #getElement(trackElement, selector) {
        return trackElement.querySelector(selector);
    }

    #getVisiblePanels(trackElement) {
        return parseInt(getComputedStyle(trackElement).getPropertyValue('--visible-panels'), 10) || 1;
    }

    #toggleControlsVisibility(trackElement, totalPages) {
        trackElement.classList.toggle('hide-controls', totalPages <= 1);
    }

    #setupPagination(trackElement) {
        const trackPanels = this.#getElement(trackElement, '.track__panels');
        const paginationContainer = this.#getElement(trackElement, '[data-track-pagination]');
        const visiblePanels = this.#getVisiblePanels(trackPanels);
        const trackId = trackElement.getAttribute('data-track-id');

        const pages = [];
        let currentPage = [];

        Array.from(trackPanels.children).forEach((panel, index) => {
            const panelId = `${trackId}-panel-${index}`;
            panel.setAttribute('id', panelId);
            currentPage.push(panel);
            if (currentPage.length === visiblePanels || index === trackPanels.children.length - 1) {
                pages.push(currentPage);
                currentPage = [];
            }
        });

        trackElement.pages = pages;
        trackElement.currentPageIndex = 0;

        if (paginationContainer) {
            paginationContainer.innerHTML = pages.map((page, i) => `
                <li>
                    <button
                        type="button"
                        data-page-index="${i}"
                        aria-label="Go To Page ${i + 1}"
                        ${i === 0 ? 'aria-current="true"' : ''}
                    >
                        <span class="pagination__number">
                            ${i + 1}
                        </span>
                    </button>
                </li>
            `).join('');
        }

        this.#toggleControlsVisibility(trackElement, pages.length);
        this.#updateTabIndexes(trackElement, 0);
    }

    #updatePagination(trackElement, activeIndex) {
        const paginationItems = this.#getElement(trackElement, '[data-track-pagination]')
            .querySelectorAll('[data-page-index]');
        
        paginationItems.forEach((item, index) => {
            item.classList.toggle('active', index === activeIndex);
            item.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
        });

        this.#updateLiveRegion(trackElement, activeIndex, trackElement.pages.length);
    }

    // Use getFocusableElements to update all focusable elements' tabindex and aria-hidden
    #updateTabIndexes(trackElement, activeIndex) {
        trackElement.pages.forEach((page, pageIndex) => {
            page.forEach(panel => {
                const focusableElements = getFocusableElements(panel);  // Get all focusable elements in the panel

                // Set tabindex and aria-hidden based on visibility
                const isVisible = pageIndex === activeIndex;
                panel.setAttribute('aria-hidden', isVisible ? 'false' : 'true');  // Update aria-hidden

                focusableElements.forEach(el => {
                    el.setAttribute('tabindex', isVisible ? '0' : '-1');  // Enable or disable based on visibility
                });
            });
        });
    }

    // Primary method for navigating to a specific page index
    #navigateToPage(trackElement, pageIndex) {
        const trackPanels = this.#getElement(trackElement, '.track__panels');
        const targetPanel = trackElement.pages[pageIndex][0];

        trackElement.currentPageIndex = pageIndex;

        trackPanels.scrollTo({
            left: targetPanel.offsetLeft,
            behavior: 'smooth',
        });

        clearTimeout(this.#scrollTimeout);
        this.#scrollTimeout = setTimeout(() => {
            this.#updatePagination(trackElement, pageIndex);
        }, 300);
    }

    #navigateToNext(trackElement) {
        const newIndex = trackElement.currentPageIndex < trackElement.pages.length - 1
            ? trackElement.currentPageIndex + 1 : 0;
        this.#navigateToPage(trackElement, newIndex);
    }

    #navigateToPrev(trackElement) {
        const newIndex = trackElement.currentPageIndex > 0
            ? trackElement.currentPageIndex - 1
            : trackElement.pages.length - 1;
        this.#navigateToPage(trackElement, newIndex);
    }

    #getPeekingPadding(trackPanels) {
        const computedStyle = getComputedStyle(trackPanels);
        const panelPeeking = parseFloat(computedStyle.paddingLeft) || 0;  // Assume same for both sides
        return panelPeeking;
    }

    // Page Observer with adjusted rootMargin and threshold
    #observePages(trackElement, panelPeeking) {
        const trackPanels = this.#getElement(trackElement, '.track__panels');

        const pageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const panelId = entry.target.id;
                    const pageIndex = trackElement.pages.findIndex(page =>
                        page.some(panel => panel.id === panelId)
                    );

                    const updateOnScrollEnd = () => {
                        trackElement.currentPageIndex = pageIndex;
                        this.#updatePagination(trackElement, pageIndex);
                    };

                    if (pageIndex !== -1) {
                        if ('onscrollend' in window) {
                            trackPanels.onscrollend = updateOnScrollEnd;
                        } else {
                            trackPanels.onscroll = () => {
                                clearTimeout(this.#scrollTimeout);
                                this.#scrollTimeout = setTimeout(updateOnScrollEnd, 250);
                            };
                        }
                    }
                }
            });
        }, {
            root: trackPanels,
            threshold: 0.5, // Adjust threshold to balance multiple panels being visible
            rootMargin: `0px -${panelPeeking * 0.5}px`, // Simplified negative root margin for both sides
        });

        trackElement.pages.forEach(page => {
            pageObserver.observe(page[0]);
        });

        trackElement.pageObserver = pageObserver; // Save for cleanup
    }

    // Tabbing Observer ensures only fully visible panels are tabbable
    #setupTabbingObserver(trackElement, panelPeeking) {
        const trackPanels = this.#getElement(trackElement, '.track__panels');

        const tabbingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const focusableElements = getFocusableElements(entry.target);  // Get all focusable elements in the panel

                // Set tabindex and aria-hidden based on visibility
                const isVisible = entry.isIntersecting;
                entry.target.setAttribute('aria-hidden', isVisible ? 'false' : 'true');  // Update aria-hidden

                focusableElements.forEach(el => {
                    el.setAttribute('tabindex', isVisible ? '0' : '-1');  // Enable or disable based on visibility
                });
            });
        }, {
            root: trackPanels,
            threshold: 0.5, // Only fully visible panels should be tabbable
            rootMargin: `0px -${panelPeeking}px`, // Simplified negative root margin for both sides
        });

        trackElement.pages.flat().forEach(panel => {
            tabbingObserver.observe(panel);
        });

        trackElement.tabbingObserver = tabbingObserver; // Save for cleanup
    }

    // Delegate keyboard navigation to allow both ArrowLeft and ArrowRight only when focused on next/prev buttons
    #initKeyboardNavigation(trackElement) {
        // Delegate the keydown event to the next/previous buttons
        delegateEvent(trackElement, 'keydown', '[data-track-prev], [data-track-next]', (event) => {
            if (event.code === 'ArrowRight' && event.target.matches('[data-track-next]')) {
                this.#navigateToNext(trackElement);
            } else if (event.code === 'ArrowLeft' && event.target.matches('[data-track-prev]')) {
                this.#navigateToPrev(trackElement);
            }
        });
    }

    #resetTrackState(trackElement) {
        const trackPanels = this.#getElement(trackElement, '.track__panels');
        const paginationContainer = this.#getElement(trackElement, '[data-track-pagination]');

        // Reset scroll position
        trackPanels.scrollLeft = 0;

        // Clear pagination content
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }

        // Cleanup observers
        if (trackElement.pageObserver) trackElement.pageObserver.disconnect();
        if (trackElement.tabbingObserver) trackElement.tabbingObserver.disconnect();

        trackElement.currentPageIndex = 0;

        // Compute peeking padding once for both observers
        const panelPeeking = this.#getPeekingPadding(trackPanels);

        // Reinitialize after reset
        this.#setupPagination(trackElement);
        this.#initLiveRegion(trackElement);
        this.#observePages(trackElement, panelPeeking); // Peeking observation
        this.#setupTabbingObserver(trackElement, panelPeeking); // Tabbing management
        this.#initKeyboardNavigation(trackElement);  // Add keyboard navigation
    }

    #initEventListeners(trackElement) {
        delegateEvent(trackElement, 'click', '[data-page-index]', (event) => {
            const target = event.target.closest('[data-page-index]');
            if (target) {
                const pageIndex = parseInt(target.getAttribute('data-page-index'));
                this.#navigateToPage(trackElement, pageIndex);
            }
        });

        delegateEvent(trackElement, 'click', '[data-track-prev]', () => {
            const newIndex = trackElement.currentPageIndex > 0
                ? trackElement.currentPageIndex - 1
                : trackElement.pages.length - 1;
            this.#navigateToPage(trackElement, newIndex);
        });

        delegateEvent(trackElement, 'click', '[data-track-next]', () => {
            const newIndex = trackElement.currentPageIndex < trackElement.pages.length - 1
                ? trackElement.currentPageIndex + 1
                : 0;
            this.#navigateToPage(trackElement, newIndex);
        });

        window.addEventListener('resize', () => {
            this.#resetTrackState(trackElement);
        });
    }

    #initLiveRegion(trackElement) {
        let liveRegion = this.#getElement(trackElement, '.liveregion');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.className = 'liveregion screen-reader-only';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            trackElement.appendChild(liveRegion);
        }
    }

    #updateLiveRegion(trackElement, activeIndex, totalPages) {
        const liveRegion = this.#getElement(trackElement, '.liveregion');
        if (liveRegion) {
            liveRegion.textContent = `Page ${activeIndex + 1} of ${totalPages}`;
        }
    }

    // Public methods
    init() {
        this.#trackList.forEach((trackElement, trackIndex) => {
            trackElement.setAttribute('data-track-id', `track-${trackIndex}`);
            this.#resetTrackState(trackElement);
            this.#initEventListeners(trackElement);
        });
    }

    destroy(trackElement) {
        ['pageObserver', 'tabbingObserver'].forEach(observer => {
            if (trackElement[observer]) trackElement[observer].disconnect();
        });

        clearTimeout(this.#scrollTimeout);
    }
}