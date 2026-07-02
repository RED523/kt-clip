const now = Date.now()
let items = [
  { id: 'clipboard/demo-1', text: '欢迎使用 KT Clip。点击任意记录即可复制，星标可以永久保留。', favorite: true, createdAt: now, updatedAt: now },
  { id: 'clipboard/demo-2', text: 'npm run build', favorite: false, createdAt: now - 60000, updatedAt: now - 60000 },
  { id: 'clipboard/demo-3', text: 'https://www.u-tools.cn/docs/developer/', favorite: false, createdAt: now - 120000, updatedAt: now - 120000 }
]

function changed () {
  window.dispatchEvent(new CustomEvent('clipboard-history-changed'))
}

export function installDevMock () {
  if (window.utools) return

  window.utools = {
    onPluginEnter: handler => window.setTimeout(() => handler({ code: 'clipboard-history', type: 'text', payload: '' }), 0),
    onPluginOut: () => {},
    copyText: text => {
      navigator.clipboard?.writeText(text)
      return true
    }
  }

  window.clipboardHistory = {
    list: () => items,
    copyText: text => window.utools.copyText(text),
    toggleFavorite: (id, favorite) => {
      items = items.map(item => item.id === id ? { ...item, favorite } : item)
      changed()
      return true
    },
    remove: id => {
      items = items.filter(item => item.id !== id)
      changed()
      return true
    },
    clear: () => {
      const count = items.filter(item => !item.favorite).length
      items = items.filter(item => item.favorite)
      changed()
      return count
    }
  }
}
