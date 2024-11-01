/*

In this file:

// A. Delegate Event

*/

//////////////////////////////////////////////
// A. Delegate Event
//////////////////////////////////////////////

export const delegateEvent = (parent, eventType, selector, handler) => {

  // Basic error handling

  if (!(parent instanceof Element || parent instanceof Document)) {
    console.error('Invalid parent element provided to delegateEvent.');
    return;
  }
  
  if (typeof eventType !== 'string' || !eventType) {
    console.error('Invalid or missing event type provided to delegateEvent.');
    return;
  }
  
  if (typeof selector !== 'string' || !selector) {
    console.error('Invalid or missing selector provided to delegateEvent.');
    return;
  }
  
  if (typeof handler !== 'function') {
    console.error('Invalid or missing handler function provided to delegateEvent.');
    return;
  }

  parent.addEventListener(eventType, (event) => {
    if (event.target.matches(selector) || event.target.closest(selector)) {
      handler(event);
    }
  });
};