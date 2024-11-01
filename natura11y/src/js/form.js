import { delegateEvent } from './utilities/eventDelegation';

//////////////////////////////////////////////
// A. Shared Methods
//////////////////////////////////////////////

const isEmpty = (value) => !value?.trim();

const setFieldValidity = (field, isValid, invalidClasses = ['is-invalid']) => {
  const entryRoot = field.closest('.form-entry');
  entryRoot.classList.toggle(invalidClasses[0], !isValid);
  field.setAttribute('aria-invalid', !isValid);
};

//////////////////////////////////////////////
// B. Form Input 
//////////////////////////////////////////////

export default class FormInput {

  #formEntryList = document.querySelectorAll('.form-entry');
  #invalidClasses = ['is-invalid'];
  #formSubmitAttempted = false;

  // Private methods

  #checkIfEmpty(field) {
    const isFieldEmpty = isEmpty(field.value);
    setFieldValidity(field, !isFieldEmpty, this.#invalidClasses);
    return isFieldEmpty;
  }

  #handleInputChange(formEntryInput, isRequired) {
    // Check if empty or not if submission has already been attempted
    if (this.#formSubmitAttempted && isRequired) {
      this.#checkIfEmpty(formEntryInput);
    }

    // Toggle 'has-value' class based on input content
    formEntryInput.closest('.form-entry').classList.toggle('has-value', formEntryInput.value !== '');
  }

  // Attach input event listener to dynamically validate while typing
  #addDynamicValidation(formEntryInput) {
    formEntryInput.addEventListener('input', () => {
      this.#checkIfEmpty(formEntryInput); // Remove error if the field becomes valid
    });
  }

  #processFormEntryInput(formEntryInput, isRequired) {
    const isInputText = formEntryInput.closest('.form-entry').querySelector('.form-entry__field__input');

    if (isRequired) {
      formEntryInput.setAttribute('required', 'true');
      formEntryInput.setAttribute('aria-required', 'true');
    }

    // Add dynamic validation on input event (removes error class when user types)
    this.#addDynamicValidation(formEntryInput);

    // Handle input change on 'change' event
    formEntryInput.addEventListener('change', () => this.#handleInputChange(formEntryInput, isRequired));

    // Handle click events on input text spans
    if (isInputText) {
      isInputText.addEventListener('click', this.#handleClickOnInputText);
    }
  }

  #handleClickOnInputText(event) {
    const clickInput = event.target.closest('.form-entry__field__input').querySelector('input');
    if (event.target.tagName === 'SPAN') clickInput.focus();
  }

  // Public methods

  init() {
    this.#formEntryList.forEach((formEntry) => {
      const isRequired = formEntry.hasAttribute('data-required');
      const formEntryInputList = formEntry.querySelectorAll('input, select, textarea');
      
      // Process each form entry input
      formEntryInputList.forEach((formEntryInput) => this.#processFormEntryInput(formEntryInput, isRequired));

      // Scoped Event Delegation for focusin and focusout (within each formEntry)
      delegateEvent(formEntry, 'focusin', 'input, select, textarea', (event) => {
        this.#toggleFocusClass(event, true);
      });

      delegateEvent(formEntry, 'focusout', 'input, select, textarea', (event) => {
        this.#toggleFocusClass(event, false);
      });
    });
  }

  #toggleFocusClass(event, isFocused = true) {
    event.target.closest('.form-entry').classList.toggle('is-focused', isFocused);
  }
}

//////////////////////////////////////////////
// C. Form Submission 
//////////////////////////////////////////////

export class FormSubmission {
  #formList = document.querySelectorAll('form[novalidate]');
  #invalidClasses = ['is-invalid'];
  #formSubmitAttempted = false;

  #processFormErrors(formErrorsList, errorsArray) {
    formErrorsList.forEach((formError) => {
      const formEntry = formError.closest('.form-entry');
      const formEntryLabel = formEntry.querySelector('.form-entry__field__label');
      const errorMessage = formEntry.getAttribute('data-error-message') || 'This field is required';
      const helpText = formEntry.querySelector('.form-entry__help')?.innerHTML || '';

      errorsArray.push([errorMessage, helpText]);

      if (!formEntry.querySelector('.form-entry__feedback')) {
        formEntryLabel.insertAdjacentHTML('afterend', this.#createErrorMessage(errorMessage, helpText));
      }
    });
  }

  #createErrorMessage(desc, inst) {
    return `
      <small class="form-entry__feedback" role="alert">
        <span class="icon icon-warn" aria-hidden="true"></span>
        <span class="message">
          <strong>${desc}</strong> ${inst || ''}
        </span>
      </small>
    `;
  }

  #scrollToFirstError(form) {
    const firstError = form.querySelector('.is-invalid, [data-alert]');
    if (firstError) {
      window.scrollTo({ top: firstError.offsetTop - 16, behavior: 'smooth' });
    }
  }

  #checkIfEmpty(field) {
    const isFieldEmpty = isEmpty(field.value);
    setFieldValidity(field, !isFieldEmpty, this.#invalidClasses);
    return isFieldEmpty;
  }

  #handleFormSubmission(form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.#formSubmitAttempted = true;
      const errorsArray = [];

      const inputFields = form.querySelectorAll('input, select, textarea');
      inputFields.forEach((field) => {
        if (field.hasAttribute('required')) {
          this.#checkIfEmpty(field);
        }
      });

      const formErrorsList = form.querySelectorAll(':invalid');
      this.#processFormErrors(formErrorsList, errorsArray);

      if (errorsArray.length > 0) {
        event.preventDefault();
        this.#scrollToFirstError(form);
      }
    });
  }

  init() {
    this.#formList.forEach((form) => this.#handleFormSubmission(form));
  }
}

//////////////////////////////////////////////
// D. Form File Upload
//////////////////////////////////////////////

export class FormFileUpload {
  #fileUploadList = document.querySelectorAll('.file-upload');

  #handleFileChange(fileUpload) {
    return (event) => {
      const [file] = event.target.files;
      if (!file) return;
      const { name: fileName, size } = file;
      const fileSize = size >= 1e6 ? `${(size / 1e6).toFixed(2)} MB` : `${(size / 1e3).toFixed(2)} KB`;

      const fileUploadData = fileUpload.querySelector('.file-upload__data');
      if (fileUploadData) fileUploadData.remove();

      fileUpload.insertAdjacentHTML('beforeend', `
        <span class="file-upload__data">
          <span class="file-name">${fileName}</span>
          <span class="file-size">${fileSize}</span>
        </span>
      `);
    };
  }

  dragOver(event) {
    event.preventDefault();
    event.target.closest('.form-entry').classList.add('is-focused');
  }

  dragOff(event) {
    event.target.closest('.form-entry').classList.remove('is-focused');
  }

  dropped(event) {
    event.preventDefault();
    event.target.closest('.form-entry').classList.remove('is-focused');
  }

  #handleFileUpload(fileUpload) {
    const fileUploadInput = fileUpload.querySelector('input[type="file"]');
    fileUploadInput.addEventListener('change', this.#handleFileChange(fileUpload));

    fileUpload.addEventListener('dragenter', this.dragOver.bind(this));
    fileUpload.addEventListener('dragleave', this.dragOff.bind(this));
    fileUpload.addEventListener('dragend', this.dragOff.bind(this));
    fileUpload.addEventListener('drop', this.dropped.bind(this));
  }

  init() {
    this.#fileUploadList.forEach((fileUpload) => this.#handleFileUpload(fileUpload));
  }
}