export default class Table {

  // Private properties
  
  #tableStackList = document.querySelectorAll('[class*="table--stack"]');
  #tableScrollList = document.querySelectorAll('.table-scroll');

  // Private methods

  #populateHeaders(tableStack) {
    const tableHeaderList = tableStack.querySelectorAll('thead th');
    const tableRowList = tableStack.querySelectorAll('tbody tr');
    let headers = [];

    tableHeaderList.forEach((tableHeader, index) => {
      if (tableHeader.textContent !== '') {
        const title = tableHeader.textContent.trim();
        headers.push({ title, id: `header-${index}` });
        tableHeader.setAttribute('id', `header-${index}`);
      }
    });

    tableRowList.forEach((tableRow) => {
      const tableDataList = tableRow.querySelectorAll('td');

      tableDataList.forEach((tableData, index) => {
        tableData.innerHTML = this.#createNewTableDataContent(tableData.innerHTML);
        tableData.setAttribute('data-header', headers[index].title);
        tableData.setAttribute('aria-labelledby', headers[index].id);
      });
    });
  }

  #createNewTableDataContent(oldContent) {
    return `
      <div class="td-content">
        ${oldContent}
      </div>
    `;
  }

  #handleTableScroll() {
    this.#tableScrollList.forEach((scrollElement) => {
      let scrollTarget = scrollElement.querySelector('.table-scroll__container');
      let maxWidth = scrollElement.offsetWidth;
      let scrollWidth = scrollTarget.scrollWidth;

      const removeGradient = () => {
        let scrollPosition = scrollTarget.scrollLeft;
        scrollPosition > 1
          ? scrollTarget.setAttribute('data-scrolling', true)
          : scrollTarget.setAttribute('data-scrolling', false);
      };

      scrollWidth > maxWidth
        ? scrollElement.setAttribute('data-scroll', true)
        : scrollElement.setAttribute('data-scroll', false);

      scrollTarget.addEventListener('scroll', removeGradient, {
        passive: true,
      });
    });
  }

  // Public methods

  init() {
    this.#tableStackList.forEach((tableStack) => {
      this.#populateHeaders(tableStack);
    });

    this.#handleTableScroll();
    window.addEventListener('resize', this.#handleTableScroll.bind(this));
  }
}