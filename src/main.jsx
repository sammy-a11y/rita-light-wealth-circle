import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import App from './App.jsx'
import './index.css'

AOS.init({
  duration: 600,
  easing: 'ease-out-cubic',
  once: true,
  offset: 60
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1830',
            color: '#f1f0ff',
            border: '1px solid #534AB7',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#7F77DD',
              secondary: '#f1f0ff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f0ff'
            }
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)