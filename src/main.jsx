import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<p style="padding:20px;font-family:sans-serif;">Error: no #root element. Check index.html.</p>'
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
