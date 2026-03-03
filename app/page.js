'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setUser(session.user)
    }
    getUser()
  }, [])

  return (
    <div style={{
      fontFamily: 'Georgia, serif',
      background: '#FAFAF9',
      minHeight: '100vh',
      color: '#1C1814'
    }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(250,250,249,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8E5DF',
        height: '64px',
        display: 'flex', alignItems: 'center',
        padding: '0 2rem',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '1.1rem', fontWeight: '700',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#5FAD65', display: 'inline-block'
          }}></span>
          Solid Financial Habits
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {user ? (
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: '#1C1814', color: 'white',
                border: 'none', borderRadius: '100px',
                padding: '0.55rem 1.25rem',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer'
              }}
            >
              My Dashboard →
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                style={{
                  background: 'transparent', color: '#4A453E',
                  border: 'none', borderRadius: '100px',
                  padding: '0.55rem 1.25rem',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Log in
              </button>
              <button
                onClick={() => router.push('/signup')}
                style={{
                  background: '#1C1814', color: 'white',
                  border: 'none', borderRadius: '100px',
                  padding: '0.55rem 1.25rem',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Get started free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '8rem 1.5rem 5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background blobs */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 70% 55% at 15% 85%, rgba(95,173,101,0.1) 0%, transparent 65%),
            radial-gradient(ellipse 55% 45% at 85% 15%, rgba(232,168,37,0.08) 0%, transparent 60%)
          `
        }}></div>

        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: '#F0F7F1', border: '1px solid #D6EDD8',
          color: '#1E5422', borderRadius: '100px',
          padding: '0.4rem 1rem', marginBottom: '2rem',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '0.78rem', fontWeight: '700',
          letterSpacing: '0.08em', textTransform: 'uppercase'
        }}>
          🌱 Built for people who haven't started yet
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
          fontWeight: '400', lineHeight: '1.05',
          letterSpacing: '-0.02em',
          maxWidth: '820px', marginBottom: '1.75rem'
        }}>
          Stop avoiding your money.<br />
          <span style={{ fontStyle: 'italic', color: '#3A8A40' }}>Start knowing</span> where it goes.
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: '1.2rem', lineHeight: '1.75',
          color: '#4A453E', maxWidth: '520px',
          marginBottom: '2.5rem', fontWeight: '400',
          fontFamily: 'system-ui, sans-serif'
        }}>
          Most budgeting apps are built for people who are already good with money.
          This one is built for everyone else.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/signup')}
            style={{
              background: '#1C1814', color: 'white',
              border: 'none', borderRadius: '100px',
              padding: '1rem 2rem',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            See my money picture →
          </button>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'transparent', color: '#4A453E',
              border: '1.5px solid #D0CBC0', borderRadius: '100px',
              padding: '1rem 2rem',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '1rem', fontWeight: '600', cursor: 'pointer'
            }}
          >
            I already have an account
          </button>
        </div>

        {/* Trust bar */}
        <div style={{
          display: 'flex', gap: '3rem', flexWrap: 'wrap',
          justifyContent: 'center', marginTop: '4rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          {[
            { num: 'Free', label: 'Always. No credit card.' },
            { num: '5 min', label: 'To see your full picture' },
            { num: '0', label: 'Judgment. Ever.' }
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.9rem', fontWeight: '400',
                fontFamily: 'Georgia, serif', lineHeight: '1'
              }}>{item.num}</div>
              <div style={{
                fontSize: '0.78rem', color: '#8A8278',
                fontWeight: '500', marginTop: '0.25rem'
              }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{
        background: '#1C1814', color: '#FAFAF9',
        padding: '7rem 1.5rem', textAlign: 'center'
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: '700',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#E8A825', marginBottom: '1.5rem',
            fontFamily: 'system-ui, sans-serif'
          }}>
            Who this is for
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: '400', lineHeight: '1.15',
            letterSpacing: '-0.02em', marginBottom: '3rem'
          }}>
            If you've ever thought <em>"I should really figure out my finances"</em> — this is for you.
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1px', background: 'rgba(255,255,255,0.08)',
            borderRadius: '16px', overflow: 'hidden',
            fontFamily: 'system-ui, sans-serif'
          }}>
            {[
              { emoji: '😰', text: "You avoid checking your bank account because it stresses you out" },
              { emoji: '🤷', text: "You make decent money but have nothing to show for it" },
              { emoji: '💳', text: "You're not sure how much debt you actually have" },
              { emoji: '🔄', text: "You've tried budgeting apps before and always quit" },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(28,24,20,0.95)',
                padding: '2rem 1.5rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{item.emoji}</div>
                <p style={{
                  fontSize: '0.9rem', lineHeight: '1.6',
                  color: 'rgba(250,250,249,0.7)'
                }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '7rem 1.5rem', background: '#F5F4F0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: '700',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#3A8A40', marginBottom: '0.75rem',
              fontFamily: 'system-ui, sans-serif'
            }}>
              How it works
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: '400', lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}>
              Three steps to financial clarity
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              {
                num: '01',
                title: 'Face the number',
                desc: 'Connect your bank or enter manually. See what actually comes in and what actually goes out. Most people have never done this.',
                color: '#F0F7F1'
              },
              {
                num: '02',
                title: 'Understand the gap',
                desc: 'One number. The difference between what you earn and what you spend. Everything else is noise until you know this.',
                color: '#FDF3DC'
              },
              {
                num: '03',
                title: 'Build the habit',
                desc: 'Come back next month. That\'s it. One monthly check-in is more powerful than any budget spreadsheet you\'ll never use.',
                color: '#EAF2F8'
              }
            ].map((step, i) => (
              <div key={i} style={{
                background: 'white', border: '1px solid #E8E5DF',
                borderRadius: '20px', padding: '2rem',
                transition: 'transform 0.2s'
              }}>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '3rem', fontWeight: '400',
                  color: '#E8E5DF', lineHeight: '1',
                  marginBottom: '1rem'
                }}>{step.num}</div>
                <div style={{
                  background: step.color,
                  borderRadius: '12px', padding: '0.75rem',
                  display: 'inline-block', marginBottom: '1rem',
                  fontSize: '1.5rem'
                }}>
                  {['🪞', '📊', '🏆'][i]}
                </div>
                <h3 style={{
                  fontSize: '1.2rem', fontWeight: '700',
                  marginBottom: '0.5rem',
                  fontFamily: 'system-ui, sans-serif'
                }}>{step.title}</h3>
                <p style={{
                  fontSize: '0.9rem', color: '#8A8278',
                  lineHeight: '1.65',
                  fontFamily: 'system-ui, sans-serif'
                }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE MINDSET */}
      <section style={{
        padding: '7rem 1.5rem',
        background: '#FAFAF9', textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: '700',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#3A8A40', marginBottom: '1.5rem',
            fontFamily: 'system-ui, sans-serif'
          }}>
            The mindset shift
          </div>
          <blockquote style={{
            fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
            fontStyle: 'italic', lineHeight: '1.4',
            fontWeight: '400', color: '#1C1814',
            marginBottom: '2rem'
          }}>
            "You don't need a better budget. You need to look at your money long enough to stop being afraid of it."
          </blockquote>
          <p style={{
            fontSize: '1rem', color: '#8A8278', lineHeight: '1.7',
            fontFamily: 'system-ui, sans-serif'
          }}>
            The math of budgeting is easy. The psychology is hard.
            Solid Financial Habits addresses why you avoid looking —
            before telling you what to do.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        background: '#3A8A40', padding: '7rem 1.5rem',
        textAlign: 'center', color: 'white'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: '700',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)', marginBottom: '1rem',
            fontFamily: 'system-ui, sans-serif'
          }}>
            Ready?
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '400', lineHeight: '1.1',
            letterSpacing: '-0.02em', marginBottom: '1rem'
          }}>
            The first step is just looking.
          </h2>
          <p style={{
            fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)',
            lineHeight: '1.7', marginBottom: '2.5rem',
            fontFamily: 'system-ui, sans-serif'
          }}>
            No perfect plan required. No financial knowledge needed.
            Just five minutes and an honest look at your numbers.
          </p>
          <button
            onClick={() => router.push('/signup')}
            style={{
              background: 'white', color: '#1E5422',
              border: 'none', borderRadius: '100px',
              padding: '1.1rem 2.5rem',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Start for free →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#1C1814', color: 'rgba(250,250,249,0.4)',
        padding: '3rem 1.5rem', textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          fontSize: '1.1rem', fontWeight: '700',
          color: 'rgba(250,250,249,0.7)', marginBottom: '0.75rem',
          fontFamily: 'Georgia, serif'
        }}>
          Solid Financial Habits
        </div>
        <p style={{ fontSize: '0.82rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 1rem' }}>
          solidfinancialhabits.com — Free forever. Built for people who are just getting started.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {['Privacy Policy', 'Terms of Service', 'Security', 'Contact'].map((link, i) => (
            <a key={i} href="#" style={{
              fontSize: '0.82rem',
              color: 'rgba(250,250,249,0.35)'
            }}>{link}</a>
          ))}
        </div>
      </footer>

    </div>
  )
}