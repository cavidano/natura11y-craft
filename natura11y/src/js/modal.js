import { handleOverlayOpen, handleOverlayClose } from './utilities/overlay';
import { delegateEvent } from './utilities/eventDelegation';

export default class Modal {

	// Private properties

	#outsideClickHandlers = new Map();
	#escapeKeyHandler = this.#handleEscapeKey.bind(this);

	// Private methods
	
  #addOutsideClickHandler(modal, handler) {
		const handleDelayedOutsideClick = (event) => {
			const modalContent = modal.querySelector('.modal__content');
			if (!modalContent.contains(event.target)) {
				handler(event);
			}
		};

		window.addEventListener('pointerdown', handleDelayedOutsideClick);
		this.#outsideClickHandlers.set(modal, handleDelayedOutsideClick);
	}

	#removeOutsideClickHandler(modal) {
		const handler = this.#outsideClickHandlers.get(modal);
		if (handler) {
			window.removeEventListener('pointerdown', handler);
			this.#outsideClickHandlers.delete(modal);
		}
	}

	#handleEscapeKey(event) {
		if (event.code === 'Escape') {
			const openModals = document.querySelectorAll('.modal.shown');
			openModals.forEach((modal) => this.#handleModalClose(modal));
		}
	}

	#handleModalClose(modalTarget) {
		modalTarget.classList.remove('shown');
		
		handleOverlayClose(modalTarget);
		this.#removeOutsideClickHandler(modalTarget);

		window.removeEventListener('keydown', this.#escapeKeyHandler);
	}

	// Public methods

	openModal(modalTarget) {

		if (!modalTarget) {
			console.warn('Modal target not found.');
			return;
		}

		modalTarget.classList.add('shown');
		modalTarget.focus();

		const modalContent = modalTarget.querySelector('.modal__content');

		if (!modalContent) {
			console.warn('Modal content not found.');
			return;
		}

		handleOverlayOpen(modalContent);

		if (modalTarget.classList.contains('modal--scroll-all')) {
			modalTarget.scrollTop = 0;
		}

		const modalCloseList = modalTarget.querySelectorAll('[data-modal-close]');

		modalCloseList.forEach((modalClose) => {
			modalClose.addEventListener('click', () => this.#handleModalClose(modalTarget));
			modalClose.setAttribute('aria-label', 'Close Modal Window');
		});

		if (modalTarget.dataset.modalCloseOutside === 'true') {
			const handleCloseOutside = () => this.#handleModalClose(modalTarget);
			this.#addOutsideClickHandler(modalTarget, handleCloseOutside);
		}

		window.addEventListener('keydown', this.#escapeKeyHandler);
	}

	init() {
		delegateEvent(document, 'click', '[data-modal="open"]', (event) => {
			const modalTargetID = event.target.getAttribute('aria-controls')?.replace(/^#/, '');
			const modalTarget = document.getElementById(modalTargetID);
			this.openModal(modalTarget);
		});
	}
}