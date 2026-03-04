'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePlaidLink } from 'react-plaid-link'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [linkToken, setLinkToken] = useState(null)
  const [bankConnected, setBankConnected] = useState(false)
  const [insights, setInsights] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles').select('*')
        .eq('id', session.user.id).single()
      setProfile(profileData)

      const { data: snapshotData } = await supabase
        .from('snapshots').select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setSnapshots(snapshotData || [])

      // Check if bank is connected
      const { data: connectionData } = await supabase
        .from('plaid_connections').select('id, institution_name')
        .eq('user_id', session.user.id)
        .limit(1)
      if (connectionData && connectionData.length > 0) {
        setBankConnected(true)
        // Auto-load insights
        loadInsights(session.user.id)
      }

      setLoading(false)

      // Get Plaid link token
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id })
      })
      const data = await res.json()
      if (data.link_token) setLinkToken(data.link_token)
    }
    getData()
  }, [router])

  const loadInsights = async (userId) => {
    setLoadingInsights(true)
    const res = await fetch('/api/plaid/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    const data = await res.json()
    if (!data.error) setInsights(data)
    setLoadingInsights(false)
  }

  const onPlaidSuccess = useCallback(async (publicToken, metadata) => {
    const res = await fetch('/api/plaid/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicToken,
        userId: user.id,
        institutionName: metadata.institution?.name || 'Your Bank'
      })
    })
    const data = await res.json()
    if (data.success) {
      setBankConnected(true)
      loadInsights(user.id)
    }
  }, [user])

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  })

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
        <p style={{ color: '#8A8278' }}>Loading your dashboard...</p>
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0]
    || user?.user_metadata?.full_name?.split(' ')[0]
    || 'there'

  const latest = snapshots[0]
  const gap = latest ? latest.total_income - latest.total_expenses : null
  const pct = latest ? Math.round((latest.total_expenses / latest.total_income) * 100) : null
  const fmtUSD = (n) => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9', fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        background: 'white', borderBottom: '1px solid #E8E5DF',
        padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
          <span style={{ fontSize: '0.875rem', color: '#8A8278' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1.5px solid #E8E5DF',
            borderRadius: '100px', padding: '0.4rem 1rem',
            fontSize: '0.875rem', fontWeight: '600', color: '#4A453E', cursor: 'pointer'
          }}>Log out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontSize: '2.5rem', fontWeight: '800', color: '#1C1814',
            lineHeight: '1.1', marginBottom: '0.5rem', fontFamily: 'Georgia, serif'
          }}>
            Hey {firstName} 👋
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#8A8278', fontWeight: '300' }}>
            {latest
              ? `Last updated: ${latest.month} ${latest.year}`
              : "Let's get your financial picture set up."
            }
          </p>
        </div>

        {/* No snapshot yet */}
        {!latest && (
          <div style={{
            background: '#1C1814', borderRadius: '24px',
            padding: '3rem', textAlign: 'center', marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h2 style={{
              fontFamily: 'Georgia, serif', fontSize: '1.75rem',
              color: '#FAFAF9', marginBottom: '0.75rem', fontWeight: '400'
            }}>
              See your money picture
            </h2>
            <p style={{
              color: 'rgba(250,250,249,0.6)', fontSize: '0.95rem',
              marginBottom: '2rem', lineHeight: '1.6',
              maxWidth: '400px', margin: '0 auto 2rem'
            }}>
              Takes 5 minutes. No bank connection needed to start.
            </p>
            <button onClick={() => router.push('/onboarding')} style={{
              background: '#5FAD65', color: 'white', border: 'none',
              borderRadius: '100px', padding: '1rem 2rem',
              fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
            }}>
              Get my picture →
            </button>
          </div>
        )}

        {/* Has snapshot — show numbers */}
        {latest && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem', marginBottom: '1.5rem'
            }}>
              {[
                { label: 'Monthly Income', val: fmtUSD(latest.total_income), color: '#3A8A40' },
                { label: 'Monthly Expenses', val: fmtUSD(latest.total_expenses), color: '#E05C45' },
                {
                  label: gap >= 0 ? 'Monthly Surplus' : 'Monthly Shortfall',
                  val: (gap >= 0 ? '+' : '-') + fmtUSD(gap),
                  color: gap >= 0 ? '#3A8A40' : '#E05C45'
                },
              ].map((card, i) => (
                <div key={i} style={{
                  background: 'white', border: '1px solid #E8E5DF',
                  borderRadius: '20px', padding: '1.5rem',
                  boxShadow: '0 4px 16px rgba(28,24,20,0.06)'
                }}>
                  <div style={{
                    fontFamily: 'Georgia, serif', fontSize: '2rem',
                    color: card.color, lineHeight: '1', marginBottom: '0.4rem'
                  }}>{card.val}</div>
                  <div style={{ fontSize: '0.82rem', color: '#8A8278', fontWeight: '500' }}>
                    {card.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Spending rate */}
            <div style={{
              background: 'white', border: '1px solid #E8E5DF',
              borderRadius: '20px', padding: '1.75rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 16px rgba(28,24,20,0.06)'
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '1rem'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Spending Rate</h3>
                <span style={{
                  fontFamily: 'Georgia, serif', fontSize: '1.5rem',
                  color: pct > 90 ? '#E05C45' : pct > 75 ? '#E8A825' : '#3A8A40'
                }}>{pct}%</span>
              </div>
              <div style={{
                height: '10px', background: '#E8E5DF',
                borderRadius: '100px', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', borderRadius: '100px',
                  width: Math.min(pct, 100) + '%',
                  background: pct > 90 ? '#E05C45' : pct > 75 ? '#E8A825' : '#5FAD65'
                }}></div>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#8A8278', marginTop: '0.75rem', lineHeight: '1.5' }}>
                {pct <= 75
                  ? "Great — you're keeping expenses well under income."
                  : pct <= 90
                  ? "Getting close to the limit. Look for one area to trim."
                  : "Spending exceeds safe levels. Let's find the gap."
                }
              </p>
            </div>
          </>
        )}

        {/* ── BANK CONNECTION SECTION ── */}
        {!bankConnected ? (
          <div style={{
            background: 'white', border: '2px dashed #D0CBC0',
            borderRadius: '24px', padding: '2.5rem',
            textAlign: 'center', marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏦</div>
            <h3 style={{
              fontFamily: 'Georgia, serif', fontSize: '1.4rem',
              fontWeight: '400', marginBottom: '0.75rem', color: '#1C1814'
            }}>
              See what you're <em>actually</em> spending on
            </h3>
            <p style={{
              fontSize: '0.9rem', color: '#8A8278', lineHeight: '1.7',
              maxWidth: '420px', margin: '0 auto 1.75rem'
            }}>
              Connect your bank and we'll show you your top 3 spending categories —
              no transaction lists, no judgment, just the picture that matters.
            </p>
            <div style={{
              display: 'flex', gap: '0.75rem',
              justifyContent: 'center', flexWrap: 'wrap',
              marginBottom: '1.5rem'
            }}>
              {['🔒 Bank-level security', '👁️ Read-only access', '🚫 No transaction lists'].map((item, i) => (
                <div key={i} style={{
                  background: '#F5F4F0', borderRadius: '100px',
                  padding: '0.4rem 0.875rem',
                  fontSize: '0.78rem', fontWeight: '600', color: '#4A453E'
                }}>{item}</div>
              ))}
            </div>
            <button
              onClick={() => openPlaid()}
              disabled={!plaidReady}
              style={{
                background: plaidReady ? '#1C1814' : '#D0CBC0',
                color: 'white', border: 'none', borderRadius: '100px',
                padding: '1rem 2rem', fontSize: '1rem',
                fontWeight: '700', cursor: plaidReady ? 'pointer' : 'not-allowed'
              }}
            >
              {plaidReady ? 'Connect my bank →' : 'Loading...'}
            </button>
          </div>
        ) : (
          /* ── INSIGHTS FROM REAL TRANSACTIONS ── */
          <div style={{
            background: 'white', border: '1px solid #E8E5DF',
            borderRadius: '24px', padding: '2rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 16px rgba(28,24,20,0.06)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  Here's what we noticed this month
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#8A8278' }}>
                  {insights?.institutionName
                    ? `From ${insights.institutionName} — last 30 days`
                    : 'Last 30 days'
                  }
                </p>
              </div>
              <button
                onClick={() => loadInsights(user.id)}
                style={{
                  background: 'transparent', border: '1.5px solid #E8E5DF',
                  borderRadius: '100px', padding: '0.4rem 1rem',
                  fontSize: '0.8rem', fontWeight: '600', color: '#4A453E', cursor: 'pointer'
                }}
              >Refresh</button>
            </div>

            {loadingInsights ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#8A8278' }}>
                Looking at your transactions...
              </div>
            ) : insights ? (
              <>
                {/* Top 3 categories — the insight engine */}
                <div style={{ marginBottom: '1.5rem' }}>
                  {insights.topCategories.slice(0, 3).map((cat, i) => {
                    const maxAmount = insights.topCategories[0].amount
                    const barWidth = (cat.amount / maxAmount) * 100
                    const isTop = i === 0
                    return (
                      <div key={i} style={{
                        marginBottom: '1rem',
                        padding: '1.25rem',
                        background: isTop ? '#FDF3DC' : '#FAFAF9',
                        border: `1px solid ${isTop ? '#F3D98A' : '#E8E5DF'}`,
                        borderRadius: '16px'
                      }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: '0.5rem'
                        }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                            {isTop && <span style={{
                              background: '#E8A825', color: 'white',
                              borderRadius: '4px', padding: '0.1rem 0.4rem',
                              fontSize: '0.65rem', fontWeight: '700',
                              marginRight: '0.5rem', verticalAlign: 'middle'
                            }}>TOP</span>}
                            {cat.category}
                          </span>
                          <span style={{
                            fontFamily: 'Georgia, serif', fontSize: '1.1rem',
                            color: '#1C1814', fontWeight: '400'
                          }}>
                            {fmtUSD(cat.amount)}
                          </span>
                        </div>
                        <div style={{
                          height: '6px', background: '#E8E5DF',
                          borderRadius: '100px', overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%', borderRadius: '100px',
                            width: barWidth + '%',
                            background: isTop ? '#E8A825' : '#5FAD65'
                          }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Summary */}
                <div style={{
                  background: '#F0F7F1', border: '1px solid #D6EDD8',
                  borderRadius: '12px', padding: '1rem',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#3A8A40', fontWeight: '700', marginBottom: '0.2rem' }}>
                      Total tracked spending
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#4A453E' }}>
                      {insights.transactionCount} transactions in the last 30 days
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#3A8A40'
                  }}>
                    {fmtUSD(insights.totalSpending)}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#8A8278' }}>
                Could not load transactions. Try refreshing.
              </div>
            )}
          </div>
        )}

        {/* Update numbers */}
        {latest && (
          <div style={{
            background: '#F5F4F0', border: '1px solid #E8E5DF',
            borderRadius: '20px', padding: '1.75rem',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Update your numbers
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#8A8278' }}>
                Come back monthly to track your progress.
              </p>
            </div>
            <button onClick={() => router.push('/onboarding')} style={{
              background: '#1C1814', color: 'white', border: 'none',
              borderRadius: '100px', padding: '0.75rem 1.5rem',
              fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer'
            }}>
              Update this month →
            </button>
          </div>
        )}

        {/* History */}
        {snapshots.length > 1 && (
          <div style={{
            background: 'white', border: '1px solid #E8E5DF',
            borderRadius: '20px', padding: '1.75rem',
            boxShadow: '0 4px 16px rgba(28,24,20,0.06)',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>
              Monthly History
            </h3>
            {snapshots.map((snap, i) => {
              const snapGap = snap.total_income - snap.total_expenses
              return (
                <div key={snap.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '0.875rem 0',
                  borderBottom: i < snapshots.length - 1 ? '1px solid #E8E5DF' : 'none'
                }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {snap.month} {snap.year}
                  </span>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', color: '#8A8278' }}>{fmtUSD(snap.total_income)} in</span>
                    <span style={{ fontSize: '0.84rem', color: '#8A8278' }}>{fmtUSD(snap.total_expenses)} out</span>
                    <span style={{
                      fontSize: '0.9rem', fontWeight: '700',
                      color: snapGap >= 0 ? '#3A8A40' : '#E05C45'
                    }}>
                      {snapGap >= 0 ? '+' : '-'}{fmtUSD(snapGap)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Encouragement */}
        <div style={{
          background: '#1C1814', borderRadius: '20px',
          padding: '2rem 2.5rem',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <h3 style={{ color: '#F5C878', fontSize: '1rem', fontWeight: '700', marginBottom: '0.3rem' }}>
              🏆 The habit is the check-in.
            </h3>
            <p style={{ color: 'rgba(250,250,249,0.55)', fontSize: '0.875rem' }}>
              One month of data is interesting. Twelve months is transformational.
            </p>
          </div>
          <div style={{
            background: '#5FAD65', color: 'white', borderRadius: '100px',
            padding: '0.5rem 1.25rem', fontSize: '0.825rem',
            fontWeight: '700', whiteSpace: 'nowrap'
          }}>
            {snapshots.length} {snapshots.length === 1 ? 'month' : 'months'} tracked ✓
          </div>
        </div>

      </main>
    </div>
  )
}