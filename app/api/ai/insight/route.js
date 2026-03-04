import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request) {
  try {
    const {
      feeling,
      biggestWorry,
      triedBefore,
      totalIncome,
      totalExpenses,
      foundationTotal,
      lifestyleTotal,
      topCategories,
      monthsTracked,
      previousSnapshot
    } = await request.json()

    const gap = totalIncome - totalExpenses
    const pct = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0
    const lifestylePct = totalIncome > 0 ? Math.round((lifestyleTotal / totalIncome) * 100) : 0

    const feelingMap = {
      stressed: 'stressed and anxious about money',
      curious: 'curious but unsure where to start',
      motivated: 'motivated and ready to make changes',
      numb: 'somewhat numb to their financial situation'
    }

    const worryMap = {
      emergency: 'having no emergency fund',
      debt: 'carrying too much debt',
      savings: 'not saving enough',
      understanding: 'not understanding where their money goes'
    }

    const triedMap = {
      no: 'this is their first time tracking money',
      'yes-quit': 'they have tried budgeting before but always quit',
      'yes-going': 'they are already doing some tracking and want more structure',
      spreadsheet: 'they currently use a spreadsheet to track spending'
    }

    const topCategoriesText = topCategories && topCategories.length > 0
      ? `Top spending categories: ${topCategories.slice(0, 3).map(c => `${c.category} ($${c.amount})`).join(', ')}.`
      : 'No bank connected yet.'

    // Build continuity context if returning user
    let continuityContext = ''
    if (previousSnapshot && monthsTracked > 1) {
      const prevGap = previousSnapshot.total_income - previousSnapshot.total_expenses
      const gapChange = gap - prevGap
      const spendingChange = totalExpenses - previousSnapshot.total_expenses
      continuityContext = `
Last month: income $${previousSnapshot.total_income}, expenses $${previousSnapshot.total_expenses}, ${prevGap >= 0 ? 'surplus' : 'shortfall'} $${Math.abs(prevGap)}.
This month vs last month: spending ${spendingChange >= 0 ? 'up' : 'down'} $${Math.abs(spendingChange)}, gap ${gapChange >= 0 ? 'improved' : 'worsened'} by $${Math.abs(gapChange)}.`
    }

    const isReturning = monthsTracked > 1 && previousSnapshot

    const prompt = `You are a financial coach writing a short, personalized insight for someone using a budgeting app. Be direct and honest. Do not be preachy. Do not use hollow encouragement. Speak plainly like a trusted friend — not a financial advisor.

About this person:
- How they feel about money: ${feelingMap[feeling] || 'unknown'}
- Biggest money worry: ${worryMap[biggestWorry] || 'unknown'}
- Budgeting history: ${triedMap[triedBefore] || 'unknown'}
- This month: income $${totalIncome}, expenses $${totalExpenses}, ${gap >= 0 ? 'surplus' : 'shortfall'} $${Math.abs(gap)}
- Spending rate: ${pct}% of income
- Foundation spending: $${foundationTotal} (${totalIncome > 0 ? Math.round((foundationTotal / totalIncome) * 100) : 0}% of income)
- Lifestyle spending: $${lifestyleTotal} (${lifestylePct}% of income)
- ${topCategoriesText}
- Months tracked: ${monthsTracked || 1}
${continuityContext}

${isReturning
  ? `This person is returning for month ${monthsTracked}. Write a "since last time" paragraph that:
1. Acknowledges what changed between last month and this month — specifically, with numbers
2. Names one thing that stands out — good or concerning — without moralizing
3. Asks one question about the behavior behind the number
4. Is under 100 words`
  : `This is their first time. Write a paragraph that:
1. Acknowledges where they are emotionally without being condescending
2. Names one specific thing that stands out in their numbers — honest, not sugar-coated
3. Asks one question about the behavior behind the number — not what to do about it
4. Ends with something true and grounding
5. Is under 100 words`
}

Do not say: "great job", "you should be proud", "you're doing amazing", "I totally get", "the good news is", "journey", or any variation of these. Do not use bullet points. Write one paragraph only.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })

    const insight = message.content[0].text

    return Response.json({ insight })
  } catch (error) {
    console.error('AI insight error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}