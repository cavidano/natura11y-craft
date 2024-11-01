import { delegateEvent } from './utilities/eventDelegation';

export default class AlertDismissable {

  // Private properties
  #closeButtonHTML = `
    <button class="button button--icon-only" aria-label="Close alert" aria-describedby="alert-description">
        <span class="icon icon-close" aria-hidden="true"></span>
    </button>
  `;

  // Private methods
  #handleAlertClose = (event) => {
    event.preventDefault();
    const alertDismissable = event.target.closest('.alert--dismissable');
    if (alertDismissable) {
      alertDismissable.classList.add('dismissed');
      alertDismissable.addEventListener('animationend', () => {
        alertDismissable.remove();
      });
    }
  };

  #initializeAlert = (alertDismissable) => {
    alertDismissable.insertAdjacentHTML('afterbegin', this.#closeButtonHTML);

    // Add aria-live attribute for accessibility
    alertDismissable.setAttribute('role', 'alert');
    alertDismissable.setAttribute('aria-live', 'assertive');
    alertDismissable.setAttribute('aria-atomic', 'true');
  };

  // Public methods
  init = () => {
    // Initialize existing alerts
    document.querySelectorAll('.alert--dismissable').forEach((alertDismissable) => {
      this.#initializeAlert(alertDismissable);
    });

    // Delegate event for dynamically added alerts
    delegateEvent(document, 'click', '.alert--dismissable .button--icon-only', this.#handleAlertClose);
  };
}
