import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import App from './App.jsx'
import { installDevMock } from './devMock.js'

if (import.meta.env.DEV) installDevMock()

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
