/* eslint-env jquery */

var $grid = $('.grid').masonry({
  itemSelector: '.grid-item',
  percentPosition: true
})
$grid.masonry('layout') // Calc layout

$('#searchCatInput').on('input', debounce(function () {
  const searchTerm = $('#searchCatInput').val().toLowerCase()
  $('.grid-item').each(function () {
    const item = $(this)
    const matchesSearch = item.text().toLowerCase().indexOf(searchTerm) !== -1
    if (matchesSearch) item.show()
    else item.hide()
  })
  $grid.masonry('layout') // Calc layout
}, 300, true))

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce (func, wait, immediate) {
  var timeout
  return function () {
    var context = this; var args = arguments
    var later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    var callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
};
