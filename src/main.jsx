import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import { MenuProvider } from './context/MenuContext.jsx'
import { BookingProvider } from './context/BookingContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <MenuProvider>
                <BookingProvider>
                    <App />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#1A0A0A',
                                color: '#FDF6E3',
                                border: '1px solid #D4A843',
                                fontFamily: 'Inter, sans-serif',
                            },
                            success: { iconTheme: { primary: '#D4A843', secondary: '#1A0A0A' } },
                            error: { iconTheme: { primary: '#E74C3C', secondary: '#fff' } },
                        }}
                    />
                </BookingProvider>
            </MenuProvider>
        </AuthProvider>
    </React.StrictMode>,
)
