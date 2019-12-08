/* eslint-env jquery */
var $grid = $('.grid').masonry({
  itemSelector: '.grid-item',
  percentPosition: true
})
var msnry = $grid.data('masonry')
$grid.infiniteScroll({
  outlayer: msnry,
  path: '.pagination__next',
  status: '.page-load-status',
  append: '.grid-item',
  history: false
})
$grid.imagesLoaded().progress(function () {
  $grid.masonry('layout')
})

var possibleInitialUsernames = [
  'Shakespeare',
  'Socrates',
  'NikolaTesla',
  'YuriGagarin',
  'WaltDisney',
  'Oprah',
  'Malala',
  'Marie_Curie',
  'Hypatia',
  'AgathaChristie'
]
var savedusername = possibleInitialUsernames[Math.floor(Math.random() * possibleInitialUsernames.length)]
function validTwitterUsername (sn) {
  return /^[a-zA-Z0-9_]{1,15}$/.test(sn)
}

function openModal (content) {
  function closeModal () {
    modalContainer.fadeOut(200, function () { $(this).remove() })
  }
  const modalContainer = $('<div class="modal-container">')
  modalContainer.hide()
  const modalBackground = $('<div class="modal-background">')
  modalBackground.on('click', closeModal)
  modalContainer.append(modalBackground)
  const modalContent = $('<div class="modal-content">')
  modalContent.append(content)
  modalContainer.append(modalContent)
  $('body').append(modalContainer)
  modalContainer.fadeIn(200)
  return { closeModal, modalContent }
}

window.sendCard = sendCard
function sendCard (cardID) {
  const cardImagePath = $(`#card-id-${cardID}`)[0].src
  const modalOptions = openModal(`
  <div class="card-modal">
    <div class="img-container"><img src="${cardImagePath}" /></div>
    <div><label>
      Twitter handle: <input type="text" id="receiverUsername" placeholder="@${escapeHtml(savedusername)}" />
    </label></div>
    <button id="sendCardButton">Send card via bot</button>
    <div class="or-separator"><span>OR</span></div>
    <button id="downloadButton">Download</button>
  </div>
  `)
  $('#sendCardButton').on('click', function () {
    const twitterHandle = $('#receiverUsername').val()
    sendCardRequest(modalOptions, cardID, twitterHandle)
  })
  $('#downloadButton').on('click', function () {
    window.download(cardImagePath)
  })
}
function sendCardRequest (modalOptions, cardID, twitterHandle) {
  twitterHandle = twitterHandle.replace('@', '')
  if (!validTwitterUsername(twitterHandle)) {
    alert('That doesn\'t look like a twitter username')
    return false
  }
  savedusername = twitterHandle
  modalOptions.modalContent.text('Sending card...')
  httpRequest('GET', '/send?card=' + cardID + '&username=' + twitterHandle, function () {
    var res = JSON.parse(this.responseText)
    modalOptions.modalContent.text(res.message)
    setTimeout(() => {
      modalOptions.closeModal()
    }, 5000)
  })
}

function httpRequest (method, path, callback) {
  const xmlhttp = new XMLHttpRequest()
  xmlhttp.open(method, path, true)
  xmlhttp.addEventListener('load', callback)
  xmlhttp.send()
}

var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}
function escapeHtml (string) {
  return String(string).replace(/[&<>"'`=/]/g, function (s) {
    return entityMap[s]
  })
}
