import { handleOverlayOpen, handleOverlayClose } from './utilities/overlay';
import { focusTrap, getFocusableElements } from './utilities/focus';
import { delegateEvent } from './utilities/eventDelegation';

export default class Lightbox {

  // Private properties
  #lightboxTargetList = document.querySelectorAll('[data-lightbox]');

  #lightboxHTML = `
    <figure class="lightbox__container" aria-live="polite" aria-atomic="true">
      <div class="lightbox__media"></div>           
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <div class="lightbox__controls">
      <button class="button button--icon-only" data-lightbox-previous aria-label="Previous">
        <span class="icon icon-arrow-left" aria-hidden="true"></span>
      </button>
      <button class="button button--icon-only" data-lightbox-next aria-label="Next">
        <span class="icon icon-arrow-right" aria-hidden="true"></span>
      </button>
      <button class="button button--icon-only" data-lightbox-close aria-label="Close">
        <span class="icon icon-close" aria-hidden="true"></span>
      </button>
    </div>
  `;

  #lightboxVideoHTML = `
    <video controls tabindex="0">
      <source type="video/mp4">
    </video>
  `;

  #lightboxVideoIframeHTML = `
    <iframe
      frameborder="0"
      allow="autoplay; fullscreen;"
      allowfullscreen
      controls
      tabindex="0"
    ></iframe>
  `;

  #lighboxLoaderHTML = `
    <div class="lightbox__media__loader">
      <span class="icon icon-loading icon--rotate" aria-hidden="true"></span>
    </div>
    <div class="lightbox__media__error" style="display: none;">
      <span class="icon icon-warn" aria-hidden="true"></span>
      <p>Failed to load content. Please try again later.</p>
    </div>
  `;

  #lightboxElementHTML = `<img src="https://source.unsplash.com/1600x900"/>`;

  #lightboxes = [];

  // Private methods

  #handleLightboxOpen = (index) => (e) => {
    // Check if lightbox exists
    const lightbox = document.querySelector('.lightbox');
    if (lightbox) return;

    e.preventDefault();

    this.lightbox = this.#createLightbox();

    this.lightbox.setAttribute('aria-hidden', false);

    this.currentLB = index;

    this.#updateLightbox(index);
    handleOverlayOpen(this.lightbox);
  };

  #handleLightboxClose = (e) => {
    e.stopPropagation();

    if (e.target !== e.currentTarget && e.type === 'click') return;

    // Cleanup listeners before removing the lightbox
    const lightboxPrevious = this.lightbox.querySelector('[data-lightbox-previous]');
    const lightboxNext = this.lightbox.querySelector('[data-lightbox-next]');
    const lightboxClose = this.lightbox.querySelector('[data-lightbox-close]');

    lightboxPrevious.removeEventListener('click', this.#handleLightboxUpdateClick);
    lightboxNext.removeEventListener('click', this.#handleLightboxUpdateClick);
    lightboxClose.removeEventListener('click', this.#handleLightboxClose);

    handleOverlayClose(this.lightbox);

    this.lightbox.parentElement.removeChild(this.lightbox);

    // Remove keyup event listener
    window.removeEventListener('keyup', this.#handleLightboxUpdateKey);
  };

  #handleCaptionDisplay = (show = false) => {
    const captionElement = this.lightbox.querySelector('.lightbox__caption');
    captionElement.style.display = show ? 'block' : 'none';
  };

  #handleLightboxUpdateClick = (e) => {
    e.preventDefault();

    if (e.target.hasAttribute('data-lightbox-previous')) {
      this.#updateDirection(-1);
    } else if (e.target.hasAttribute('data-lightbox-next')) {
      this.#updateDirection(1);
    } else {
      return;
    }
  };

  #handleLightboxUpdateKey = (e) => {
    e.preventDefault();

    if (
      this.#lightboxes.length <= 1 &&
      (e.code === 'ArrowLeft' || e.code === 'ArrowRight')
    ) {
      return;
    }

    switch (e.code) {
      case 'ArrowLeft':
        this.#updateDirection(-1);
        this.lightbox.querySelector('[data-lightbox-previous]').focus();
        break;
      case 'ArrowRight':
        this.#updateDirection(1);
        this.lightbox.querySelector('[data-lightbox-next]').focus();
        break;
      case 'Escape':
        this.#handleLightboxClose(e);
        break;
      default:
        return;
    }
  };

  #handleVideoFocus = (lightboxElement) => {
    const handleFocusEvent = (event) => {
      event.preventDefault();
      lightboxElement.children[0].focus();
      getFocusableElements(lightboxElement.children[0]);
    }

    lightboxElement.setAttribute('tabindex', 0);
    lightboxElement.addEventListener('focus', handleFocusEvent);
  };

  #updateDirection(dir) {
    this.currentLB += dir;

    if (this.currentLB < 0) {
      this.currentLB = this.#lightboxes.length - 1;
    } else if (this.currentLB >= this.#lightboxes.length) {
      this.currentLB = 0;
    }

    this.#updateLightbox(this.currentLB);
  }

  #updateLightbox(index) {
    const lightboxElement = this.lightbox.querySelector('.lightbox__media');
    const lightboxCaption = this.lightbox.querySelector('.lightbox__caption');

    // Clear the previous lightbox content before inserting a new one
    lightboxElement.innerHTML = '';
    
    let lightboxElementTarget;

    // Extract lightbox object data into variables
    const { lbType, lbSrc, lbAlt, lbCaption } = this.#lightboxes[index];

    // Update caption display based on attribute presence
    const shouldDisplayCaption = lbCaption !== null;
    this.#handleCaptionDisplay(shouldDisplayCaption);

    switch (lbType) {
      case 'image':
        lightboxElementTarget = this.#updateLightboxImage(lightboxElement, lbSrc);
        break;

      case 'video':
        lightboxElementTarget = this.#updateLightboxVideo(lightboxElement, lbSrc);
        break;

      default:
        break;
    }

    // Handle video focus
    this.#handleVideoFocus(lightboxElement);

    if (shouldDisplayCaption) {
      lightboxCaption.innerHTML = lbCaption;
    }

    focusTrap(this.lightbox);
  }

  #updateLightboxImage = (lightboxElement, lbSrc) => {
    if (lightboxElement.hasAttribute('style')) {
      lightboxElement.removeAttribute('style');
    }

    lightboxElement.innerHTML = this.#lightboxElementHTML;

    const loader = this.#createLoader();
    lightboxElement.appendChild(loader);

    const lightboxElementTarget = lightboxElement.querySelector('img');

    lightboxElementTarget.src = lbSrc;

    this.#handleMediaLoading(lightboxElementTarget, loader);

    return lightboxElementTarget;
  }

  #updateLightboxVideo = (lightboxElement, lbSrc) => {
    const hasYouTube = /youtube/i.test(lbSrc);
    const hasVimeo = /vimeo/i.test(lbSrc);

    let lightboxElementTarget;

    if (hasYouTube || hasVimeo) {
      lightboxElement.innerHTML = this.#lightboxVideoIframeHTML;
      lightboxElementTarget = lightboxElement.querySelector('iframe');
      lightboxElementTarget.src = lbSrc;
    } else {
      lightboxElement.innerHTML = this.#lightboxVideoHTML;

      const loader = this.#createLoader();
      lightboxElement.appendChild(loader);
      
      lightboxElementTarget = lightboxElement.querySelector('source');
      const video = lightboxElement.querySelector('video');

      video.addEventListener('loadedmetadata', () => {
        let intrinsicWidth = video.videoWidth;
        let intrinsicHeight = video.videoHeight;
        lightboxElement.style.maxWidth = `${intrinsicWidth}px`;
        lightboxElement.style.aspectRatio = `${intrinsicWidth} / ${intrinsicHeight}`;
      });

      this.#handleMediaLoading(lightboxElementTarget, loader);
      lightboxElementTarget.src = lbSrc;
    }

    return lightboxElementTarget;
  }

  #createLoader = () => {
    const loader = document.createElement('div');
    loader.className = 'lightbox__media__loader';
    loader.innerHTML = this.#lighboxLoaderHTML;
    return loader;
  }

  #handleMediaLoading = (media, loader) => {
    const mediaLoadEvent = media.nodeName === 'SOURCE' ? 'loadeddata' : 'load';

    media.closest(media.nodeName === 'SOURCE' ? 'video' : 'img')
      .addEventListener(mediaLoadEvent, () => {
        if (loader && loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }

        if (this.#lightboxes[this.currentLB].lbCaption !== null) {
          this.#handleCaptionDisplay(true);
        }
      });

    media.onerror = () => {
      const loaderIcon = loader.querySelector('.lightbox__media__loader');
      const errorMessage = loader.querySelector('.lightbox__media__error');

      media.style.display = 'none';
      this.#handleCaptionDisplay(false);

      loaderIcon.style.display = 'none';
      errorMessage.style.display = 'block';
    };
  }

  #createLightbox = () => {
    const lightbox = document.createElement('div');
    lightbox.classList.add('lightbox');
    lightbox.setAttribute('aria-hidden', true);
    lightbox.setAttribute('aria-live', 'polite');
    lightbox.innerHTML = this.#lightboxHTML;

    document.body.appendChild(lightbox);

    const lightboxPrevious = lightbox.querySelector('[data-lightbox-previous]');
    const lightboxNext = lightbox.querySelector('[data-lightbox-next]');
    const lightboxClose = lightbox.querySelector('[data-lightbox-close]');

    if (this.#lightboxes.length <= 1) {
      lightboxPrevious.setAttribute('disabled', true);
      lightboxNext.setAttribute('disabled', true);
      lightboxPrevious.style.display = 'none';
      lightboxNext.style.display = 'none';
    }

    lightboxClose.addEventListener('click', this.#handleLightboxClose);
    lightboxPrevious.addEventListener('click', this.#handleLightboxUpdateClick);
    lightboxNext.addEventListener('click', this.#handleLightboxUpdateClick);

    window.addEventListener('keyup', this.#handleLightboxUpdateKey);

    return lightbox;
  }

  #setLightboxProperties = (lightboxButton) => {
    let defaultSrc = null;
    let defaultAlt = '';

    const hasImage = lightboxButton.querySelector('img') !== null;

    if (hasImage) {
      const img = lightboxButton.querySelector('img');
      defaultSrc = img.src || null;
      defaultAlt = img.alt || '';
    }

    const lbType = lightboxButton.getAttribute('data-lightbox') || 'image';
    const lbSrc = lightboxButton.getAttribute('data-lightbox-src') || defaultSrc;
    const lbCaption = lightboxButton.getAttribute('data-lightbox-caption') || null;
    const lbAlt = lightboxButton.getAttribute('data-lightbox-alt') || defaultAlt;

    if (lbSrc === null) {
      console.error('No source provided for lightbox');
      return null;
    }

    return { lbType, lbSrc, lbCaption, lbAlt };
  }

  #configureLightboxElements = () => {
    this.#lightboxTargetList.forEach((lightboxTarget) => {
      this.#lightboxes.push(this.#setLightboxProperties(lightboxTarget));
    });
  }

  #initEventListeners = () => {
    delegateEvent(document, 'click', '[data-lightbox]', (e) => {
      const lightboxButton = e.target.closest('[data-lightbox]');
      const index = Array.from(this.#lightboxTargetList).indexOf(lightboxButton);
      if (index !== -1) this.#handleLightboxOpen(index)(e);
    });
  }

  #initLazyLoading = () => {
    const options = {
      threshold: 0.25,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          const src = lazyImage.dataset.lightboxSrc || lazyImage.src;
          if (!src) return;

          observer.unobserve(lazyImage);
          const hiddenLargeImage = new Image();
          hiddenLargeImage.onload = () => {
            document.body.appendChild(hiddenLargeImage);
          };
          hiddenLargeImage.onerror = () => {
            console.error(`Failed to load image: ${src}`);
          };
          hiddenLargeImage.src = src;
          hiddenLargeImage.style.display = 'none';

          this.#lightboxes[Number(lazyImage.dataset.index)].hiddenImage = hiddenLargeImage;
        }
      });
    }, options);

    const imageLightboxList = Array.from(this.#lightboxTargetList).filter(
      (lb) => lb.getAttribute('data-lightbox') === 'image'
    );

    imageLightboxList.forEach((imageLightbox, index) => {
      const lazyImage = imageLightbox.querySelector('img');
      if (!lazyImage) return;

      lazyImage.dataset.index = index;
      observer.observe(lazyImage);
    });
  }

  // Public methods

  init = () => {
    this.#configureLightboxElements();
    this.#initEventListeners();
    this.#initLazyLoading();
  };
}