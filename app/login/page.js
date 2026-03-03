'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Success — send them to their dashboard
    router.push('/dashboard')
  }

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    border: '1.5px solid #E8E5DF',
    borderRadius: '12px',
    fontSize: '1rem',
    outline: 'none',
    background: 'white',
    color: '#1C1814',
    boxSizing: 'border-box'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAF9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        border: '1px solid #E8E5DF',
        borderRadius: '24px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 12px 40px rgba(28,24,20,0.1)'
      }}>

        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '1.25rem', fontWeight: '700', color: '#1C1814'
          }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#5FAD65', display: 'inline-block'
            }}></span>
            Solid Financial Habits
          </div>
        </div>

        <h1 style={{
          fontSize: '1.75rem', fontWeight: '700',
          color: '#1C1814', marginBottom: '0.5rem', lineHeight: '1.2'
        }}>
          Welcome back
        </h1>
        <p style={{ color: '#8A8278', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Log in to see your financial picture.
        </p>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block', fontSize: '0.85rem',
              fontWeight: '600', color: '#4A453E', marginBottom: '0.4rem'
            }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{
              display: 'block', fontSize: '0.85rem',
              fontWeight: '600', color: '#4A453E', marginBottom: '0.4rem'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <a href="/forgot-password" style={{
              fontSize: '0.85rem', color: '#3A8A40',
              fontWeight: '600', textDecoration: 'none'
            }}>
              Forgot password?
            </a>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FDE8E4', border: '1px solid #F5C4BC',
              borderRadius: '12px', padding: '0.875rem 1rem',
              color: '#B83520', fontSize: '0.875rem', marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.95rem',
              background: loading ? '#8A8278' : '#1C1814',
              color: 'white', border: 'none', borderRadius: '100px',
              fontSize: '1rem', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Logging in...' : 'Log in →'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '1.5rem',
          fontSize: '0.875rem', color: '#8A8278'
        }}>
          Don't have an account?{' '}
          <a href="/signup" style={{ color: '#3A8A40', fontWeight: '600' }}>
            Sign up free
          </a>
        </p>

      </div>
    </div>
  )
}