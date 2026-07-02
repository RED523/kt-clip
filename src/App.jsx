import { useCallback, useEffect, useMemo, useState } from 'react'

function formatTime (timestamp) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}

export default function App () {
  const [active, setActive] = useState(false)
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const refresh = useCallback(() => {
    setItems(window.clipboardHistory?.list() || [])
  }, [])

  useEffect(() => {
    window.utools.onPluginEnter(({ code, type, payload }) => {
      if (code !== 'clipboard-history') return
      setActive(true)
      setQuery(type === 'text' && typeof payload === 'string' ? payload : '')
      refresh()
    })
    window.utools.onPluginOut(() => setActive(false))
    window.addEventListener('clipboard-history-changed', refresh)
    return () => window.removeEventListener('clipboard-history-changed', refresh)
  }, [refresh])

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase()
    return keyword
      ? items.filter(item => item.text.toLocaleLowerCase().includes(keyword))
      : items
  }, [items, query])

  const handleCopy = (item) => {
    if (!window.clipboardHistory.copyText(item.text)) return
    setCopiedId(item.id)
    window.setTimeout(() => setCopiedId(''), 1200)
  }

  if (!active) return null

  return (
    <main className='app-shell'>
      <header className='app-header'>
        <div>
          <p className='eyebrow'>KT CLIP</p>
          <h1>剪贴板历史</h1>
        </div>
        <span className='count'>{filteredItems.length} 条记录</span>
      </header>

      <section className='toolbar'>
        <label className='search-box'>
          <span aria-hidden='true'>⌕</span>
          <input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder='搜索剪贴内容…'
          />
          {query && <button className='icon-button' onClick={() => setQuery('')} aria-label='清空搜索'>×</button>}
        </label>
        <button
          className='clear-button'
          onClick={() => window.clipboardHistory.clear()}
          disabled={!items.some(item => !item.favorite)}
          title='收藏的记录会被保留'
        >
          清空未收藏
        </button>
      </section>

      {filteredItems.length > 0
        ? (
          <section className='history-list'>
            {filteredItems.map(item => (
              <article className='history-card' key={item.id} onDoubleClick={() => handleCopy(item)}>
                <button className='content-button' onClick={() => handleCopy(item)}>
                  <span className='content'>{item.text}</span>
                  <span className='meta'>{formatTime(item.updatedAt)} · {item.text.length} 字符</span>
                </button>
                <div className='card-actions'>
                  <button
                    className={`action-button ${item.favorite ? 'is-favorite' : ''}`}
                    onClick={() => window.clipboardHistory.toggleFavorite(item.id, !item.favorite)}
                    aria-label={item.favorite ? '取消收藏' : '收藏'}
                    title={item.favorite ? '取消收藏' : '收藏'}
                  >
                    {item.favorite ? '★' : '☆'}
                  </button>
                  <button className='action-button copy-action' onClick={() => handleCopy(item)}>
                    {copiedId === item.id ? '已复制' : '复制'}
                  </button>
                  <button
                    className='action-button delete-action'
                    onClick={() => window.clipboardHistory.remove(item.id)}
                    aria-label='删除'
                    title='删除'
                  >
                    ×
                  </button>
                </div>
              </article>
            ))}
          </section>
          )
        : (
          <section className='empty-state'>
            <div className='empty-icon'>⌘C</div>
            <h2>{query ? '没有匹配记录' : '还没有剪贴记录'}</h2>
            <p>{query ? '换个关键词试试' : '复制文本后，记录会自动出现在这里'}</p>
          </section>
          )}
    </main>
  )
}
