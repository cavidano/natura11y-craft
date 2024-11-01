/*

In this file:

// A. Focusable Elements
// B. Focus Trap

*/

import { handleOverlayClose } from './overlay';

//////////////////////////////////////////////
// A. Focusable Elements
//////////////////////////////////////////////

export const getFocusableElements = (element = document) => {

    const els = [
        'a[href]',
        'area',
        'button',
        'details',
        'frame',
        'iframe',
        'input',
        'object',
        'summary',
        'textarea',
        'select',
        '[tabindex]:not([tabindex="-1"])',
        'video',
        'audio'
    ];

    return [...element.querySelectorAll(els)].filter((el) => {
        return !el.hasAttribute('disabled');
    });
}

//////////////////////////////////////////////
// B. Focus Trap
//////////////////////////////////////////////

export const focusTrap = (element, firstFocusTarget = element) => {

    let focusableElements = getFocusableElements(element);
    
    let firstFocusableElement = focusableElements[0];
    let lastFocusableElement = focusableElements[focusableElements.length - 1];

    firstFocusTarget.setAttribute('tabindex', '-1');
    firstFocusTarget.focus();

    element.addEventListener('keydown', (event) => {

        switch (event.code) {
            case 'Tab':

                if (document.activeElement === lastFocusableElement) {
                    if (!event.shiftKey) {
                        event.preventDefault();
                        firstFocusableElement.focus();
                    }
                }

                if (document.activeElement === firstFocusableElement) {
                    if (event.shiftKey) {
                        event.preventDefault();
                        lastFocusableElement.focus();
                    }
                }

                break;

            case 'Escape':
                handleOverlayClose(element);
                break;
            
            default:
                // do nothing
        }
    
    });
}