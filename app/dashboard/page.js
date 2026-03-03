'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Not logged in — send to login page
        router.push('/login')
        return
      }

      setUser(session.user)

      // Get their profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#FAFAF9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#5FAD65', margin: '0 auto 1rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}></div>
          <p style={{ color: '#8A8278', fontSize: '0.9rem' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there'


  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAF9',
      fontFamily: 'system-ui, sans-serif'
    }}>

      {/* Nav */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #E8E5DF',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '1.1rem', fontWeight: '700', color: '#1C1814'
        }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#5FAD65', display: 'inline-block'
          }}></span>
          Solid Financial Habits
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#8A8278' }}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: '1.5px solid #E8E5DF',
              borderRadius: '100px', padding: '0.4rem 1rem',
              fontSize: '0.875rem', fontWeight: '600', color: '#4A453E',
              cursor: 'pointer'
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem', fontWeight: '800',
            color: '#1C1814', lineHeight: '1.1', marginBottom: '0.5rem'
          }}>
            Hey {firstName} 👋
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#8A8278', fontWeight: '300' }}>
            Welcome to your financial dashboard. Let's build some solid habits.
          </p>
        </div>

        {/* Coming soon cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>

          {/* Income vs Spending */}
          <div style={{
            background: 'white', border: '1px solid #E8E5DF',
            borderRadius: '20px', padding: '2rem',
            boxShadow: '0 4px 16px rgba(28,24,20,0.06)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem', color: '#1C1814' }}>
              Income vs Spending
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#8A8278', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              See exactly where your money goes each month.
            </p>
            <div style={{
              background: '#F0F7F1', border: '1px solid #D6EDD8',
              borderRadius: '100px', padding: '0.4rem 1rem',
              fontSize: '0.75rem', fontWeight: '700', color: '#3A8A40',
              display: 'inline-block'
            }}>
              Coming soon
            </div>
          </div>

          {/* Connect Bank */}
          <div style={{
            background: 'white', border: '1px solid #E8E5DF',
            borderRadius: '20px', padding: '2rem',
            boxShadow: '0 4px 16px rgba(28,24,20,0.06)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏦</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem', color: '#1C1814' }}>
              Connect Your Bank
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#8A8278', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Securely link your accounts via Plaid for automatic tracking.
            </p>
            <div style={{
              background: '#F0F7F1', border: '1px solid #D6EDD8',
              borderRadius: '100px', padding: '0.4rem 1rem',
              fontSize: '0.75rem', fontWeight: '700', color: '#3A8A40',
              display: 'inline-block'
            }}>
              Coming soon
            </div>
          </div>

          {/* Habit Score */}
          <div style={{
            background: 'white', border: '1px solid #E8E5DF',
            borderRadius: '20px', padding: '2rem',
            boxShadow: '0 4px 16px rgba(28,24,20,0.06)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📈</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem', color: '#1C1814' }}>
              Habit Score
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#8A8278', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Track your financial habits month over month.
            </p>
            <div style={{
              background: '#F0F7F1', border: '1px solid #D6EDD8',
              borderRadius: '100px', padding: '0.4rem 1rem',
              fontSize: '0.75rem', fontWeight: '700', color: '#3A8A40',
              display: 'inline-block'
            }}>
              Coming soon
            </div>
          </div>

          {/* Savings Goals */}
          <div style={{
            background: 'white', border: '1px solid #E8E5DF',
            borderRadius: '20px', padding: '2rem',
            boxShadow: '0 4px 16px rgba(28,24,20,0.06)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem', color: '#1C1814' }}>
              Savings Goals
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#8A8278', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Set and track goals — emergency fund, debt payoff, and more.
            </p>
            <div style={{
              background: '#F0F7F1', border: '1px solid #D6EDD8',
              borderRadius: '100px', padding: '0.4rem 1rem',
              fontSize: '0.75rem', fontWeight: '700', color: '#3A8A40',
              display: 'inline-block'
            }}>
              Coming soon
            </div>
          </div>

        </div>

        {/* Encouragement banner */}
        <div style={{
          background: '#1C1814', borderRadius: '20px',
          padding: '2rem 2.5rem',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <h3 style={{
              color: '#F5C878', fontSize: '1.1rem',
              fontWeight: '700', marginBottom: '0.4rem'
            }}>
              🏆 You showed up. That's the whole game.
            </h3>
            <p style={{ color: 'rgba(250,250,249,0.6)', fontSize: '0.9rem' }}>
              Creating your account is step one. The dashboard features are being built right now.
            </p>
          </div>
          <div style={{
            background: '#5FAD65', color: 'white',
            borderRadius: '100px', padding: '0.6rem 1.25rem',
            fontSize: '0.875rem', fontWeight: '700', whiteSpace: 'nowrap'
          }}>
            Day 1 ✓
          </div>
        </div>

      </main>
    </div>
  )
}