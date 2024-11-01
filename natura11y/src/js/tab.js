import { delegateEvent } from './utilities/eventDelegation';
import { handleArrowKeyNavigation } from './utilities/keyboardNavigation';

export default class Tab {

  // Private properties

  #tabsList = document.querySelectorAll('.tabs');

  // Private methods

  #deactivateTabs(tabsButtonList, tabsPanelList) {
    tabsButtonList.forEach((tab) => {
      tab.setAttribute('aria-selected', 'false');
      tab.setAttribute('tabindex', '-1');
      tab.classList.remove('is-active');
    });
    
    tabsPanelList.forEach((panel) => {
      panel.classList.remove('shown');
      panel.setAttribute('aria-hidden', 'true'); // Ensure it's hidden from screen readers
    });
  }

  #activateTab(tab, tabsButtonList, tabsPanelList) {
    this.#deactivateTabs(tabsButtonList, tabsPanelList);

    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.classList.add('is-active');

    const controls = tab.getAttribute('aria-controls');
    const currentTabPanel = document.getElementById(controls);

    currentTabPanel.classList.add('shown'); // Use 'shown' to make the panel visible
    currentTabPanel.setAttribute('aria-hidden', 'false'); // Make it visible to screen readers
  }

  // Public methods

  init() {

    this.#tabsList.forEach((tab) => {
      const tabsButtonList = tab.querySelectorAll('[role="tab"]');
      const tabsPanelList = tab.querySelectorAll('[role="tabpanel"]');

      delegateEvent(tab, 'click', '[role="tab"]', (event) => {
        const clickedTab = event.target.closest('[role="tab"]');
        this.#activateTab(clickedTab, tabsButtonList, tabsPanelList);
      });

      delegateEvent(tab, 'keydown', '[role="tab"]', (event) => {
        if (!['Enter', 'Space', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.code)) {
          return;
        }

        const focusedTab = event.target.closest('[role="tab"]');
        const index = Array.from(tabsButtonList).indexOf(focusedTab);

        switch (event.code) {
          case 'Enter':
          case 'Space':
            event.preventDefault();
            this.#activateTab(focusedTab, tabsButtonList, tabsPanelList);
            break;
          case 'ArrowLeft':
          case 'ArrowRight':
          case 'Home':
          case 'End':
            handleArrowKeyNavigation(event, index, tabsButtonList, (targetIndex) => {
              tabsButtonList[targetIndex].focus();
            });
            break;
          default:
            break;
        }
      });

      this.#activateTab(tabsButtonList[0], tabsButtonList, tabsPanelList);
    });

  }

}