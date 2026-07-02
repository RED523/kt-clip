const { clipboard } = require('electron')
const crypto = require('node:crypto')

const DOCUMENT_PREFIX = 'clipboard/'
const MAX_ITEMS = 200
const MAX_TEXT_LENGTH = 100000
const POLL_INTERVAL = 700

let lastText = ''

function listItems () {
  return window.utools.db.allDocs(DOCUMENT_PREFIX)
    .map(({ _id, _rev, ...item }) => ({ id: _id, ...item }))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt)
}

function notifyChanged () {
  window.dispatchEvent(new CustomEvent('clipboard-history-changed'))
}

function saveText (rawText) {
  const text = typeof rawText === 'string' ? rawText.trim() : ''
  if (!text || text.length > MAX_TEXT_LENGTH) return false

  const hash = crypto.createHash('sha256').update(text).digest('hex')
  const id = `${DOCUMENT_PREFIX}${hash}`
  const previous = window.utools.db.get(id)
  const now = Date.now()
  const result = window.utools.db.put({
    _id: id,
    ...(previous?._rev ? { _rev: previous._rev } : {}),
    text,
    favorite: previous?.favorite === true,
    createdAt: previous?.createdAt || now,
    updatedAt: now
  })

  if (!result.ok) return false
  pruneItems()
  notifyChanged()
  return true
}

function pruneItems () {
  const removable = listItems()
    .filter(item => !item.favorite)
    .slice(MAX_ITEMS)

  removable.forEach(item => window.utools.db.remove(item.id))
}

function updateFavorite (id, favorite) {
  if (typeof id !== 'string' || !id.startsWith(DOCUMENT_PREFIX)) return false
  const doc = window.utools.db.get(id)
  if (!doc) return false
  const result = window.utools.db.put({ ...doc, favorite: favorite === true })
  if (result.ok) notifyChanged()
  return result.ok === true
}

function removeItem (id) {
  if (typeof id !== 'string' || !id.startsWith(DOCUMENT_PREFIX)) return false
  const result = window.utools.db.remove(id)
  if (result.ok) notifyChanged()
  return result.ok === true
}

function clearItems () {
  const removable = listItems().filter(item => !item.favorite)
  removable.forEach(item => window.utools.db.remove(item.id))
  if (removable.length) notifyChanged()
  return removable.length
}

function copyText (text) {
  if (typeof text !== 'string' || !text) return false
  const copied = window.utools.copyText(text)
  if (copied) {
    lastText = text
    saveText(text)
  }
  return copied
}

window.clipboardHistory = {
  list: listItems,
  copyText,
  toggleFavorite: updateFavorite,
  remove: removeItem,
  clear: clearItems
}

function captureClipboard () {
  const text = clipboard.readText()
  if (!text || text === lastText) return
  lastText = text
  saveText(text)
}

captureClipboard()
setInterval(captureClipboard, POLL_INTERVAL)
