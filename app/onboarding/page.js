'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const EXPENSE_CATEGORIES = [
  { key: 'rent', label: '🏠 Rent or mortgage' },
  { key: 'utilities', label: '💡 Utilities & internet' },
  { key: 'groceries', label: '🛒 Groceries' },
  { key: 'transport', label: '🚗 Car payment & transport' },
  { key: 'dining', label: '🍕 Dining out & takeout' },
  { key: 'subscriptions', label: '📱 Subscriptions & phone' },
  { key: 'shopping', label: '🛍️ Shopping & personal care' },
  { key: 'debt', label: '💳 Debt payments' },
  { key: 'other', label: '📦 Everything else' },
]

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [feeling, setFeeling] = useState('')
  const [biggestWorry, setBiggestWorry] = useState('')
  const [triedBefore, setTriedBefore] = useState('')
  const [income, setIncome] = useState({ job: '', side: '', other: '' })
  const [expenses, setExpenses] = useState({
    rent: '', utilities: '', groceries: '',
    transport: '', dining: '', subscriptions: '',
    shopping: '', debt: '', other: ''
  })
  const [categoryLabels, setCategoryLabels] = useState({})
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
    }
    getUser()
  }, [router])

  const totalIncome = Object.values(income).reduce((a, b) => a + (parseFloat(b) || 0), 0)
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + (parseFloat(b) || 0), 0)
  const gap = totalIncome - totalExpenses
  const pct = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0

  const fmtUSD = (n) => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })

  // Only show categories where user entered an amount
  const activeCategories = EXPENSE_CATEGORIES.filter(cat => parseFloat(expenses[cat.key]) > 0)

  const foundationTotal = activeCategories
    .filter(cat => categoryLabels[cat.key] === 'foundation')
    .reduce((sum, cat) => sum + (parseFloat(expenses[cat.key]) || 0), 0)

  const lifestyleTotal = activeCategories
    .filter(cat => categoryLabels[cat.key] === 'lifestyle')
    .reduce((sum, cat) => sum + (parseFloat(expenses[cat.key]) || 0), 0)

  const allLabeled = activeCategories.length > 0 &&
    activeCategories.every(cat => categoryLabels[cat.key])

  const getPersonalizedMessage = () => {
    if (gap < 0) {
      if (feeling === 'stressed') return "You already knew something was off. Now you have the exact number. That awareness is the first real step."
      if (feeling === 'numb') return "This is your wake-up call — and you showed up for it. That matters more than the number."
      return `You're spending ${fmtUSD(Math.abs(gap))} more than you earn. Now you know. That's more than most people ever find out.`
    }
    if (pct > 80) {
      if (feeling === 'stressed') return "You're technically positive — but the margin is thin. One unexpected expense and you're in the red."
      return `You're in the positive but spending ${pct}% of your income. There's room to build a real cushion.`
    }
    if (feeling === 'motivated') return `You're ahead by ${fmtUSD(gap)} — and you came here ready to act. Let's put that surplus to work.`
    if (feeling === 'curious') return `You were curious enough to look — and what you found is good news. You have ${fmtUSD(gap)} of breathing room.`
    return `You're ahead by ${fmtUSD(gap)} this month.`
  }

  const getNextStep = () => {
    if (gap < 0) return `Find ${fmtUSD(Math.abs(gap) * 0.5)} in cuts — start with your biggest lifestyle expense.`
    if (biggestWorry === 'emergency') return `Build your $1,000 emergency fund first. Automate ${fmtUSD(Math.min(gap * 0.5, 200))}/month the day after payday.`
    if (biggestWorry === 'debt') return `With ${fmtUSD(gap)} surplus, list your balances smallest to largest and attack the first one.`
    if (biggestWorry === 'savings') return `Automate ${fmtUSD(gap * 0.5)}/month into a separate savings account. Name it something specific.`
    if (gap < 500) return `Build a $1,000 emergency fund first. It's the most important financial move you can make right now.`
    return `Automate ${fmtUSD(gap * 0.5)} into savings the day after payday. Waiting for "leftover" money never works.`
  }

  const getEncouragement = () => {
    if (triedBefore === 'yes-quit') return "You've tried before and quit — that's normal. The difference this time is you're starting with honesty instead of a perfect plan."
    if (triedBefore === 'yes-going') return "You're already building habits. This adds a layer of real clarity to what you're doing."
    if (triedBefore === 'no') return "This is your first time. Most people never start. Today is a real milestone."
    return "Showing up is the hardest part. You did it."
  }

  const saveAndContinue = async () => {
    setSaving(true)
    const now = new Date()

    await supabase.from('profiles').update({
      feeling,
      biggest_worry: biggestWorry,
      tried_before: triedBefore
    }).eq('id', user.id)

    await supabase.from('snapshots').insert({
      user_id: user.id,
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear(),
      total_income: totalIncome,
      total_expenses: totalExpenses
    })

    // Save Foundation vs Lifestyle labels
    const labelRows = activeCategories.map(cat => ({
      user_id: user.id,
      category: cat.key,
      label: categoryLabels[cat.key] || 'unlabeled'
    }))

    if (labelRows.length > 0) {
      await supabase.from('category_labels').insert(labelRows)
    }

    setSaving(false)
    router.push('/dashboard')
  }

  const progress = ((step + 1) / 7) * 100

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid #E8E5DF', borderRadius: '12px',
    fontSize: '1rem', outline: 'none',
    background: 'white', color: '#1C1814',
    boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.84rem', fontWeight: '600',
    color: '#4A453E', marginBottom: '0.4rem',
    fontFamily: 'system-ui, sans-serif'
  }

  const choiceStyle = (selected) => ({
    display: 'flex', alignItems: 'center', gap: '1rem',
    background: selected ? '#F0F7F1' : '#FAFAF9',
    border: `1.5px solid ${selected ? '#3A8A40' : '#E8E5DF'}`,
    borderRadius: '12px', padding: '1rem 1.25rem',
    cursor: 'pointer', transition: 'all 0.2s',
    marginBottom: '0.75rem'
  })

  const eyebrow = (text) => (
    <div style={{
      fontSize: '0.72rem', fontWeight: '700',
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: '#3A8A40', marginBottom: '1rem',
      fontFamily: 'system-ui, sans-serif'
    }}>{text}</div>
  )

  const headline = (text) => (
    <h2 style={{
      fontFamily: 'Georgia, serif', fontSize: '1.9rem',
      fontWeight: '400', lineHeight: '1.15',
      marginBottom: '0.75rem', color: '#1C1814'
    }} dangerouslySetInnerHTML={{ __html: text }} />
  )

  const subtext = (text) => (
    <p style={{
      color: '#8A8278', fontSize: '0.9rem',
      marginBottom: '1.75rem', lineHeight: '1.6',
      fontFamily: 'system-ui, sans-serif'
    }}>{text}</p>
  )

  const nextBtn = (onClick, disabled = false, label = 'Continue →') => (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', marginTop: '1.5rem', padding: '0.95rem',
      background: disabled ? '#D0CBC0' : '#1C1814',
      color: 'white', border: 'none', borderRadius: '100px',
      fontSize: '1rem', fontWeight: '700',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'system-ui, sans-serif'
    }}>{label}</button>
  )

  const backBtn = (onClick) => (
    <button onClick={onClick} style={{
      background: 'transparent', color: '#8A8278',
      border: '1.5px solid #E8E5DF', borderRadius: '100px',
      padding: '0.9rem 1.25rem', fontSize: '0.9rem',
      fontWeight: '500', cursor: 'pointer',
      fontFamily: 'system-ui, sans-serif',
      marginTop: '1.5rem', marginRight: '0.75rem'
    }}>← Back</button>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#FAFAF9',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', padding: '2rem 1rem'
    }}>
      <div style={{
        background: 'white', border: '1px solid #E8E5DF',
        borderRadius: '24px', padding: '2.5rem',
        width: '100%', maxWidth: '520px',
        boxShadow: '0 12px 40px rgba(28,24,20,0.1)'
      }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '1rem', fontWeight: '700', color: '#1C1814',
          marginBottom: '1.5rem'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#5FAD65', display: 'inline-block'
          }}></span>
          Solid Financial Habits
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px', background: '#E8E5DF',
          borderRadius: '100px', marginBottom: '2rem', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', background: '#5FAD65',
            borderRadius: '100px', width: progress + '%',
            transition: 'width 0.5s ease'
          }}></div>
        </div>

        {/* ── STEP 0: HOW DO YOU FEEL ── */}
        {step === 0 && (
          <div>
            {eyebrow('Question 1 of 3')}
            {headline('How do you feel when you think about <em>your money</em>?')}
            {subtext("There's no wrong answer. This shapes everything we show you.")}
            {[
              { val: 'stressed', emoji: '😰', label: 'Stressed or anxious', desc: 'I try not to think about it too much' },
              { val: 'curious', emoji: '🤔', label: 'Curious but unsure', desc: "I want to know but don't know where to start" },
              { val: 'motivated', emoji: '💪', label: 'Motivated and ready', desc: "I've been meaning to do this for a while" },
              { val: 'numb', emoji: '😶', label: 'Kind of numb to it', desc: 'It is what it is — I just go with the flow' },
            ].map((item) => (
              <div key={item.val} onClick={() => setFeeling(item.val)} style={choiceStyle(feeling === item.val)}>
                <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.925rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', color: '#8A8278' }}>{item.desc}</div>
                </div>
              </div>
            ))}
            {nextBtn(() => feeling && setStep(1), !feeling)}
          </div>
        )}

        {/* ── STEP 1: BIGGEST WORRY ── */}
        {step === 1 && (
          <div>
            {eyebrow('Question 2 of 3')}
            {headline("What's your <em>biggest</em> money worry right now?")}
            {subtext("We'll use this to personalize your action plan.")}
            {[
              { val: 'emergency', emoji: '🛡️', label: "I have no emergency fund", desc: "One bad month could wipe me out" },
              { val: 'debt', emoji: '💳', label: "I'm carrying too much debt", desc: "Credit cards, loans — it feels overwhelming" },
              { val: 'savings', emoji: '🏦', label: "I'm not saving enough", desc: "I know I should be but I never seem to" },
              { val: 'understanding', emoji: '🤷', label: "I just don't understand where it goes", desc: "Money comes in and just... disappears" },
            ].map((item) => (
              <div key={item.val} onClick={() => setBiggestWorry(item.val)} style={choiceStyle(biggestWorry === item.val)}>
                <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.925rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', color: '#8A8278' }}>{item.desc}</div>
                </div>
              </div>
            ))}
            <div>{backBtn(() => setStep(0))}{nextBtn(() => biggestWorry && setStep(2), !biggestWorry)}</div>
          </div>
        )}

        {/* ── STEP 2: TRIED BEFORE ── */}
        {step === 2 && (
          <div>
            {eyebrow('Question 3 of 3')}
            {headline("Have you <em>tried budgeting</em> before?")}
            {subtext("Be honest — this helps us understand where you're coming from.")}
            {[
              { val: 'no', emoji: '🌱', label: "Nope, this is my first time", desc: "I've never really tracked my money before" },
              { val: 'yes-quit', emoji: '🔄', label: "Yes, but I always quit", desc: "I try, it works for a bit, then I stop" },
              { val: 'yes-going', emoji: '✅', label: "Yes, I'm already doing something", desc: "I want to add more structure" },
              { val: 'spreadsheet', emoji: '📊', label: "I use a spreadsheet", desc: "I track things but want something better" },
            ].map((item) => (
              <div key={item.val} onClick={() => setTriedBefore(item.val)} style={choiceStyle(triedBefore === item.val)}>
                <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.925rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', color: '#8A8278' }}>{item.desc}</div>
                </div>
              </div>
            ))}
            <div>{backBtn(() => setStep(1))}{nextBtn(() => triedBefore && setStep(3), !triedBefore)}</div>
          </div>
        )}

        {/* ── STEP 3: INCOME ── */}
        {step === 3 && (
          <div>
            {eyebrow('Step 1 of 2 — Income')}
            {headline("What comes <em>in</em> each month?")}
            {subtext("Your take-home pay after taxes. Include everything.")}
            {[
              { key: 'job', label: 'Primary job (take-home after tax)' },
              { key: 'side', label: 'Side work, freelance, or gig income' },
              { key: 'other', label: 'Any other income (benefits, support, etc.)' }
            ].map((item) => (
              <div key={item.key} style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>{item.label}</label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1.5px solid #E8E5DF', borderRadius: '12px',
                  overflow: 'hidden', background: 'white'
                }}>
                  <span style={{
                    padding: '0 0.875rem', color: '#8A8278',
                    borderRight: '1.5px solid #E8E5DF', background: '#F5F4F0',
                    alignSelf: 'stretch', display: 'flex',
                    alignItems: 'center', fontWeight: '600'
                  }}>$</span>
                  <input
                    type="number" min="0" placeholder="0"
                    value={income[item.key]}
                    onChange={(e) => setIncome({ ...income, [item.key]: e.target.value })}
                    style={{ ...inputStyle, border: 'none', borderRadius: 0 }}
                  />
                </div>
              </div>
            ))}
            <div style={{
              background: '#F0F7F1', border: '1px solid #D6EDD8',
              borderRadius: '12px', padding: '1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1E5422' }}>Total monthly income</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#3A8A40' }}>
                {fmtUSD(totalIncome)}
              </span>
            </div>
            <div>{backBtn(() => setStep(2))}{nextBtn(() => totalIncome > 0 && setStep(4), totalIncome === 0, 'Next →')}</div>
          </div>
        )}

        {/* ── STEP 4: EXPENSES ── */}
        {step === 4 && (
          <div>
            {eyebrow('Step 2 of 2 — Expenses')}
            {headline("What goes <em>out</em> each month?")}
            {subtext("Rough numbers are fine. Honesty matters more than perfection.")}
            {EXPENSE_CATEGORIES.map((item) => (
              <div key={item.key} style={{ marginBottom: '0.75rem' }}>
                <label style={labelStyle}>{item.label}</label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1.5px solid #E8E5DF', borderRadius: '12px',
                  overflow: 'hidden', background: 'white'
                }}>
                  <span style={{
                    padding: '0 0.875rem', color: '#8A8278',
                    borderRight: '1.5px solid #E8E5DF', background: '#F5F4F0',
                    alignSelf: 'stretch', display: 'flex',
                    alignItems: 'center', fontWeight: '600'
                  }}>$</span>
                  <input
                    type="number" min="0" placeholder="0"
                    value={expenses[item.key]}
                    onChange={(e) => setExpenses({ ...expenses, [item.key]: e.target.value })}
                    style={{ ...inputStyle, border: 'none', borderRadius: 0 }}
                  />
                </div>
              </div>
            ))}
            <div style={{
              background: '#FDE8E4', border: '1px solid #F5C4BC',
              borderRadius: '12px', padding: '1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#B83520' }}>Total monthly expenses</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#E05C45' }}>
                {fmtUSD(totalExpenses)}
              </span>
            </div>
            <div>{backBtn(() => setStep(3))}{nextBtn(() => setStep(5), false, 'Next →')}</div>
          </div>
        )}

        {/* ── STEP 5: FOUNDATION VS LIFESTYLE ── */}
        {step === 5 && (
          <div>
            {eyebrow('One last thing')}
            {headline("Which of these are <em>Foundation</em> vs <em>Lifestyle</em>?")}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem', marginBottom: '1.25rem'
              }}>
                <div style={{
                  background: '#F0F4FF', border: '1px solid #C7D4F5',
                  borderRadius: '12px', padding: '1rem', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏗️</div>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1C1814', marginBottom: '0.25rem' }}>Foundation</div>
                  <div style={{ fontSize: '0.75rem', color: '#8A8278', lineHeight: '1.4' }}>Keeps your life running. Non-negotiable.</div>
                </div>
                <div style={{
                  background: '#FDF3DC', border: '1px solid #F3D98A',
                  borderRadius: '12px', padding: '1rem', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✨</div>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1C1814', marginBottom: '0.25rem' }}>Lifestyle</div>
                  <div style={{ fontSize: '0.75rem', color: '#8A8278', lineHeight: '1.4' }}>How you choose to live. Flexible.</div>
                </div>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#8A8278', lineHeight: '1.6', marginBottom: '1.25rem', fontFamily: 'system-ui, sans-serif' }}>
                Tap each expense to label it. There's no right answer — only yours.
              </p>

              {activeCategories.length === 0 ? (
                <p style={{ color: '#8A8278', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                  No expenses entered. Go back to add some.
                </p>
              ) : (
                activeCategories.map((cat) => {
                  const label = categoryLabels[cat.key]
                  return (
                    <div key={cat.key} style={{
                      marginBottom: '0.75rem',
                      border: '1.5px solid #E8E5DF',
                      borderRadius: '14px', overflow: 'hidden',
                      background: 'white'
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '0.875rem 1rem',
                        borderBottom: '1px solid #E8E5DF'
                      }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{cat.label}</span>
                        <span style={{ fontFamily: 'Georgia, serif', color: '#8A8278' }}>
                          {fmtUSD(parseFloat(expenses[cat.key]) || 0)}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <button
                          onClick={() => setCategoryLabels({ ...categoryLabels, [cat.key]: 'foundation' })}
                          style={{
                            padding: '0.75rem',
                            background: label === 'foundation' ? '#E8F0FF' : 'transparent',
                            border: 'none',
                            borderRight: '1px solid #E8E5DF',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: label === 'foundation' ? '700' : '500',
                            color: label === 'foundation' ? '#2B4DB5' : '#8A8278',
                            transition: 'all 0.15s',
                            fontFamily: 'system-ui, sans-serif'
                          }}
                        >
                          🏗️ Foundation
                        </button>
                        <button
                          onClick={() => setCategoryLabels({ ...categoryLabels, [cat.key]: 'lifestyle' })}
                          style={{
                            padding: '0.75rem',
                            background: label === 'lifestyle' ? '#FDF3DC' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: label === 'lifestyle' ? '700' : '500',
                            color: label === 'lifestyle' ? '#B87D0A' : '#8A8278',
                            transition: 'all 0.15s',
                            fontFamily: 'system-ui, sans-serif'
                          }}
                        >
                          ✨ Lifestyle
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Running totals */}
              {(foundationTotal > 0 || lifestyleTotal > 0) && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem', marginTop: '1rem'
                }}>
                  <div style={{
                    background: '#E8F0FF', borderRadius: '12px',
                    padding: '0.875rem', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2B4DB5', marginBottom: '0.25rem' }}>
                      FOUNDATION
                    </div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', color: '#1C1814' }}>
                      {fmtUSD(foundationTotal)}
                    </div>
                  </div>
                  <div style={{
                    background: '#FDF3DC', borderRadius: '12px',
                    padding: '0.875rem', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#B87D0A', marginBottom: '0.25rem' }}>
                      LIFESTYLE
                    </div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', color: '#1C1814' }}>
                      {fmtUSD(lifestyleTotal)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>{backBtn(() => setStep(4))}{nextBtn(() => allLabeled && setStep(6), !allLabeled, 'See my picture 🎉')}</div>
          </div>
        )}

        {/* ── STEP 6: RESULTS ── */}
        {step === 6 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏆</div>
              <div style={{
                display: 'inline-block',
                background: '#FDF3DC', border: '1px solid #F3D98A',
                color: '#B87D0A', borderRadius: '100px',
                padding: '0.35rem 1rem', fontSize: '0.78rem',
                fontWeight: '700', letterSpacing: '0.05em',
                textTransform: 'uppercase', marginBottom: '1rem',
                fontFamily: 'system-ui, sans-serif'
              }}>
                You showed up — that's the whole game
              </div>
            </div>

            {/* Score cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0.75rem', marginBottom: '1.25rem'
            }}>
              {[
                { label: 'Income', val: fmtUSD(totalIncome), color: '#3A8A40' },
                { label: 'Expenses', val: fmtUSD(totalExpenses), color: '#E05C45' },
                { label: gap >= 0 ? 'Surplus' : 'Shortfall', val: fmtUSD(gap), color: gap >= 0 ? '#3A8A40' : '#E05C45' }
              ].map((card, i) => (
                <div key={i} style={{
                  background: '#FAFAF9', border: '1px solid #E8E5DF',
                  borderRadius: '12px', padding: '1rem', textAlign: 'center'
                }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: card.color }}>{card.val}</div>
                  <div style={{ fontSize: '0.72rem', color: '#8A8278', marginTop: '0.25rem', fontWeight: '500', fontFamily: 'system-ui, sans-serif' }}>
                    {card.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Foundation vs Lifestyle breakdown */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem', marginBottom: '1.25rem'
            }}>
              <div style={{
                background: '#E8F0FF', border: '1px solid #C7D4F5',
                borderRadius: '12px', padding: '1rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2B4DB5', marginBottom: '0.25rem', fontFamily: 'system-ui, sans-serif' }}>
                  🏗️ FOUNDATION
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', color: '#1C1814' }}>
                  {fmtUSD(foundationTotal)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8A8278', marginTop: '0.2rem', fontFamily: 'system-ui, sans-serif' }}>
                  {totalIncome > 0 ? Math.round((foundationTotal / totalIncome) * 100) : 0}% of income
                </div>
              </div>
              <div style={{
                background: '#FDF3DC', border: '1px solid #F3D98A',
                borderRadius: '12px', padding: '1rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#B87D0A', marginBottom: '0.25rem', fontFamily: 'system-ui, sans-serif' }}>
                  ✨ LIFESTYLE
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', color: '#1C1814' }}>
                  {fmtUSD(lifestyleTotal)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8A8278', marginTop: '0.2rem', fontFamily: 'system-ui, sans-serif' }}>
                  {totalIncome > 0 ? Math.round((lifestyleTotal / totalIncome) * 100) : 0}% of income
                </div>
              </div>
            </div>

            {/* Spending rate */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.82rem', color: '#8A8278', marginBottom: '0.4rem',
                fontFamily: 'system-ui, sans-serif'
              }}>
                <span>Spending rate</span>
                <span style={{ fontWeight: '700', color: pct > 90 ? '#E05C45' : pct > 75 ? '#E8A825' : '#3A8A40' }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: '8px', background: '#E8E5DF', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '100px',
                  width: Math.min(pct, 100) + '%',
                  background: pct > 90 ? '#E05C45' : pct > 75 ? '#E8A825' : '#5FAD65'
                }}></div>
              </div>
            </div>

            {/* Personalized message */}
            <div style={{
              background: '#1C1814', borderRadius: '16px',
              padding: '1.5rem', marginBottom: '1rem'
            }}>
              <p style={{
                color: '#FAFAF9', fontSize: '0.95rem',
                lineHeight: '1.65', fontFamily: 'Georgia, serif',
                fontStyle: 'italic', margin: 0
              }}>
                "{getPersonalizedMessage()}"
              </p>
            </div>

            {/* Next step */}
            <div style={{
              background: '#F0F7F1', border: '1px solid #D6EDD8',
              borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1E5422', marginBottom: '0.4rem', fontFamily: 'system-ui, sans-serif' }}>
                💡 Your next step
              </div>
              <p style={{ fontSize: '0.875rem', color: '#4A453E', lineHeight: '1.6', fontFamily: 'system-ui, sans-serif' }}>
                {getNextStep()}
              </p>
            </div>

            {/* Encouragement */}
            <div style={{
              background: '#FDF3DC', border: '1px solid #F3D98A',
              borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#B87D0A', marginBottom: '0.4rem', fontFamily: 'system-ui, sans-serif' }}>
                ✨ A note for you
              </div>
              <p style={{ fontSize: '0.875rem', color: '#4A453E', lineHeight: '1.6', fontFamily: 'system-ui, sans-serif' }}>
                {getEncouragement()}
              </p>
            </div>

            <button
              onClick={saveAndContinue}
              disabled={saving}
              style={{
                width: '100%', padding: '0.95rem',
                background: saving ? '#8A8278' : '#1C1814',
                color: 'white', border: 'none', borderRadius: '100px',
                fontSize: '1rem', fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'system-ui, sans-serif'
              }}
            >
              {saving ? 'Saving...' : 'Save & go to my dashboard →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}