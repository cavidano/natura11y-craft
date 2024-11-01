/*

In this file:

// A. Overlay Open and Close

*/

import { focusTrap } from './focus';

//////////////////////////////////////////////
// A. Overlay Open and Close
//////////////////////////////////////////////

let scrollPosition = 0;
let rootElement = document.querySelector(':root');
let lastFocusedElement;

export const handleOverlayOpen = (element) => {
    lastFocusedElement = document.activeElement;

    scrollPosition = window.scrollY;

    rootElement.style.setProperty('--scroll-position', `-${scrollPosition}px`);

    rootElement.classList.add('has-overlay');

    if(element) {
        focusTrap(element);
    }
}

export const handleOverlayClose = (element) => {
    rootElement.removeAttribute('style');

    rootElement.classList.remove('has-overlay');

    if(!rootElement.classList.length){ 
        rootElement.removeAttribute('class');
    }

    window.scrollTo({ top: scrollPosition, behavior: 'instant' });

    if(element && element.getAttribute('aria-hidden') === 'false') {
        element.setAttribute('aria-hidden', true);
    }

    if (element && lastFocusedElement) {
        lastFocusedElement.focus();
    }
}