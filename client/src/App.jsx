import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import AddSnippet from './pages/AddSnippet'
import SnippetView from './pages/SnippetView'
import authService from './services/authService'

function App() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-snippet" 
            element={
              <ProtectedRoute>
                <AddSnippet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/snippet/:id" 
            element={
              <ProtectedRoute>
                <SnippetView />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
