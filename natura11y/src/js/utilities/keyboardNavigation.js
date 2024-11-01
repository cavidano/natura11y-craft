/*

In this file:

// A. Keyboard Navigation

*/

//////////////////////////////////////////////
// A. Keyboard Navigation
//////////////////////////////////////////////

export const handleArrowKeyNavigation = (
  event, 
  currentIndex, 
  itemList, 
  directionCallback
) => {
  event.preventDefault();

  let targetIndex = currentIndex;

  switch (event.code) {
    case 'ArrowLeft':
      targetIndex = currentIndex - 1 < 0 ? itemList.length - 1 : currentIndex - 1;
      break;

    case 'ArrowRight':
      targetIndex = currentIndex + 1 >= itemList.length ? 0 : currentIndex + 1;
      break;

    case 'Home':
      targetIndex = 0;
      break;

    case 'End':
      targetIndex = itemList.length - 1;
      break;

    default:
      return; // Exit if other keys are pressed
  }

  // Call the callback function with the new target index
  directionCallback(targetIndex);
};