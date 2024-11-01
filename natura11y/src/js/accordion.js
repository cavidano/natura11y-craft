import { getFocusableElements } from './utilities/focus';
import { delegateEvent } from './utilities/eventDelegation';

export default class Accordion {

    #accordionList = document.querySelectorAll('.accordion');

    // Private method to set focusable elements within a panel
    #setFocusableElements(element = document, focusable = false) {
        const focusableElementList = getFocusableElements(element);
        focusableElementList.forEach((focusableElement) => {
            focusableElement.setAttribute('tabindex', focusable ? 0 : -1);
        });
    }

    // Private method to handle accordion initialization (open/close)
    #initAccordion(event, accordionButton, currentAccordionPanel, accordionPanelList) {
        event.preventDefault();
        event.stopPropagation();

        // Close all other accordion panels
        accordionPanelList.forEach((otherPanel) => {
            otherPanel.classList.remove('show');
            if (otherPanel !== currentAccordionPanel) {
                otherPanel.classList.remove('shown');
                otherPanel.previousElementSibling.setAttribute('aria-expanded', false);
                otherPanel.setAttribute('aria-hidden', true);
                this.#setFocusableElements(otherPanel, false);
            }
        });

        // Toggle current accordion panel
        currentAccordionPanel.classList.toggle('shown');
        const isExpanded = accordionButton.getAttribute('aria-expanded') === 'true';

        accordionButton.setAttribute('aria-expanded', !isExpanded);
        currentAccordionPanel.setAttribute('aria-hidden', isExpanded);
        this.#setFocusableElements(currentAccordionPanel, !isExpanded);

        // Dispatch a custom event when accordion is toggled
        const accTrigger = new Event('accTrigger', { bubbles: true });
        document.dispatchEvent(accTrigger);
    }

    // Private method to handle key navigation
    #handleKeyNavigation(event, accordionButtonList, index) {
        const focusNext = (dir) => {
            event.preventDefault();
            let targetFocus = index + dir;

            if (dir === -1 && targetFocus < 0) {
                accordionButtonList[accordionButtonList.length - 1].focus();
            } else if (dir === 1 && targetFocus >= accordionButtonList.length) {
                accordionButtonList[0].focus();
            } else {
                accordionButtonList[targetFocus].focus();
            }
        };

        switch (event.code) {
            case 'ArrowUp':
                focusNext(-1);
                break;
            case 'ArrowDown':
                focusNext(1);
                break;
            default:
                break;
        }
    }

    // Public methods

    init() {

        this.#accordionList.forEach((accordion) => {
            const accordionButtonList = accordion.querySelectorAll(':scope > [data-accordion="button"]');
            const accordionPanelList = accordion.querySelectorAll(':scope > [data-accordion="panel"]');

            accordionButtonList.forEach((accordionButton, index) => {

                const currentAccordionPanel = accordionButton.nextElementSibling;
                const isExpanded = accordionButton.getAttribute('aria-expanded') === 'true';

                accordionButton.setAttribute('tabindex', 0);
                currentAccordionPanel.classList.toggle('show', isExpanded);
                this.#setFocusableElements(currentAccordionPanel, isExpanded);

                // Delegate click event for accordion toggle to the accordion container
                delegateEvent(accordion, 'click', '[data-accordion="button"]', (event) => {
                    if (event.target === accordionButton) {
                        this.#initAccordion(event, accordionButton, currentAccordionPanel, accordionPanelList);
                    }
                });

                // Delegate keydown event for navigation between buttons within the accordion container
                delegateEvent(accordion, 'keydown', '[data-accordion="button"]', (event) => {
                    if (event.target === accordionButton) {
                        this.#handleKeyNavigation(event, accordionButtonList, index);
                    }
                });

                // Delegate keyup event for handling Enter key to toggle accordion within the accordion container
                delegateEvent(accordion, 'keyup', '[data-accordion="button"]', (event) => {
                    if (event.code === 'Enter') {
                        this.#initAccordion(event, accordionButton, currentAccordionPanel, accordionPanelList);
                    }
                });
            });
        });
    
    }

}