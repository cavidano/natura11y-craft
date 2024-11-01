import { handleOverlayOpen, handleOverlayClose } from './utilities/overlay';
import { delegateEvent } from './utilities/eventDelegation';

export default class Navigation {
  
  // Private properties
  
  #isAnyDropdownOpen = false;

  // Private methods

  #openDropdown(dropdownButton, dropdownMenu) {
    this.#isAnyDropdownOpen = true;

    dropdownButton.setAttribute('aria-expanded', 'true');
    dropdownMenu.classList.add('shown');

    if (dropdownMenu.classList.contains('mega-menu')) {
      handleOverlayOpen();
    }
  }

  #closeDropdown(dropdownButton, dropdownMenu) {
    this.#isAnyDropdownOpen = this.#checkAnyDropdownOpen();
    dropdownMenu.classList.remove('shown');
    dropdownButton.setAttribute('aria-expanded', 'false');

    if (dropdownMenu.classList.contains('mega-menu')) {
      handleOverlayClose();
    }
  }

  #checkAnyDropdownOpen() {
    return Array.from(document.querySelectorAll('[data-toggle="dropdown"]')).some((button) => {
      const dropdownMenu = document.getElementById(button.getAttribute('aria-controls'));
      return dropdownMenu && dropdownMenu.classList.contains('shown');
    });
  }

  #handleWindowClick = (event) => {
    if (!this.#isAnyDropdownOpen) return;

    document.querySelectorAll('[data-toggle="dropdown"]').forEach((dropdownButton) => {
      const dropdownMenu = document.getElementById(dropdownButton.getAttribute('aria-controls'));

      if (
        dropdownMenu &&
        dropdownMenu.classList.contains('shown') &&
        !dropdownMenu.contains(event.target) &&
        !dropdownButton.contains(event.target)
      ) {
        this.#closeDropdown(dropdownButton, dropdownMenu);
      }
    });
  };

  #handleEscapeKeyPress = (event) => {
    if (event.key === 'Escape' && this.#isAnyDropdownOpen) {
      document.querySelectorAll('[data-toggle="dropdown"]').forEach((dropdownButton) => {
        const dropdownMenu = document.getElementById(dropdownButton.getAttribute('aria-controls'));

        if (dropdownMenu.classList.contains('shown')) {
          this.#closeDropdown(dropdownButton, dropdownMenu);
          dropdownButton.focus();
        }
      });

      this.#isAnyDropdownOpen = false;
    }
  };

  #handleButtonMenuFocusout = (dropdownButton, dropdownMenu) => (event) => {
    const relatedTarget = event.relatedTarget;

    if (
      relatedTarget &&
      !dropdownMenu.contains(relatedTarget) &&
      !dropdownButton.contains(relatedTarget)
    ) {
      this.#closeDropdown(dropdownButton, dropdownMenu);
    }
  };

  // Public methods

  init() {
    
    delegateEvent(document, 'click', '[data-toggle="dropdown"]', (event) => {
      const dropdownButton = event.target;
      const dropdownMenuId = dropdownButton.getAttribute('aria-controls');
      const dropdownMenu = document.getElementById(dropdownMenuId);

      if (!dropdownMenu) {
        console.warn(`No dropdown menu found for ${dropdownMenuId}`);
        return;
      }

      const isShown = dropdownMenu.classList.contains('shown');

      isShown
        ? this.#closeDropdown(dropdownButton, dropdownMenu)
        : this.#openDropdown(dropdownButton, dropdownMenu);
    });

    // Delegate focusout for focus handling on dropdowns
    document.querySelectorAll('[data-toggle="dropdown"]').forEach((dropdownButton) => {
      const dropdownMenuId = dropdownButton.getAttribute('aria-controls');
      const dropdownMenu = document.getElementById(dropdownMenuId);

      if (!dropdownMenu) return;

      const focusOutHandler = this.#handleButtonMenuFocusout(dropdownButton, dropdownMenu);
      dropdownButton.addEventListener('focusout', focusOutHandler);
      dropdownMenu.addEventListener('focusout', focusOutHandler);
    });

    window.addEventListener('click', this.#handleWindowClick);
    document.addEventListener('keydown', this.#handleEscapeKeyPress);
  }
}