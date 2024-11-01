import { getFocusableElements, focusTrap } from './utilities/focus';

import { delegateEvent } from './utilities/eventDelegation';

export default class Collapse {

  // Private methods
  
  #handleCollapseClose = (button, target, focusButton = false) => {
    button.setAttribute('aria-expanded', 'false');
    target.classList.remove('shown');

    if (focusButton) {
      button.focus();
    }
  };

  #handleCollapseOpen = (button, target, focusFirst = false) => {
    button.setAttribute('aria-expanded', 'true');
    target.classList.add('shown');

    focusTrap(target);

    if (focusFirst) {
      focusFirst.focus();
    }
  };

  #handleKeyDown = (collapseButton, collapseTarget, firstFocusableElement) => {
    return (event) => {
      switch (event.code) {
        case 'Tab':
          if (document.activeElement === firstFocusableElement && event.shiftKey) {
            event.preventDefault();
            collapseButton.focus();
          }
          break;
        case 'Escape':
          this.#handleCollapseClose(collapseButton, collapseTarget, true);
          break;
        default:
        // do nothing
      }
    };
  };

  #toggleCollapse = (event) => {
    event.preventDefault();

    const collapseButton = event.target.closest('[data-toggle="collapse"]');
    if (!collapseButton) return;

    const collapseTargetID = collapseButton.getAttribute('aria-controls')?.replace(/^#/, '');
    const collapseTarget = document.getElementById(collapseTargetID);

    if (!collapseTarget) {
      console.error(`Collapse target with ID "${collapseTargetID}" not found.`);
      return;
    }

    const focusableElements = getFocusableElements(collapseTarget);
    const firstFocusableElement = focusableElements[0];

    const isExpanded = collapseButton.getAttribute('aria-expanded') === 'true' || collapseTarget.classList.contains('shown');

    if (isExpanded) {
      this.#handleCollapseClose(collapseButton, collapseTarget);
    } else {
      this.#handleCollapseOpen(
        collapseButton,
        collapseTarget,
        collapseTarget.hasAttribute('data-focus-first') ? firstFocusableElement : null
      );
    }

    // Ensure that the keydown handler is properly added and managed.
    const keydownHandler = this.#handleKeyDown(collapseButton, collapseTarget, firstFocusableElement);
    collapseTarget.addEventListener('keydown', keydownHandler);

    // Clean up event listeners when the collapse is closed.
    collapseTarget.addEventListener('transitionend', () => {
      if (!collapseTarget.classList.contains('shown')) {
        collapseTarget.removeEventListener('keydown', keydownHandler);
      }
    });

    // Optional closing logic for additional targets
    if (collapseButton.hasAttribute('data-target-close')) {
      const closeTargetID = collapseButton.getAttribute('data-target-close')?.replace(/^#/, '');
      const closeTarget = document.getElementById(closeTargetID);
      const closeTargetButton = document.querySelector(`[aria-controls="${closeTargetID}"]`);

      if (closeTarget && closeTargetButton) {
        this.#handleCollapseClose(closeTargetButton, closeTarget);
      } else {
        console.error(`Could not find close target or close target button for ID ${closeTargetID}`);
      }
    }
  };

  // Public methods
  init = () => {
    delegateEvent(document, 'click', '[data-toggle="collapse"]', this.#toggleCollapse);
  };
}