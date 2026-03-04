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
      monthsTracked
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
      ? `Their top spending categories from their connected bank are: ${topCategories.slice(0, 3).map(c => `${c.category} ($${c.amount})`).join(', ')}.`
      : 'They have not yet connected their bank account.'

    const prompt = `You are a financial coach writing a personalized insight for someone who just completed their financial onboarding. Your tone is warm, honest, and direct — never preachy or judgmental. You speak like a trusted friend who happens to know about money, not a financial advisor covering their liability.

Here is what you know about this person:

- How they feel about money: ${feelingMap[feeling] || 'unknown'}
- Their biggest money worry: ${worryMap[biggestWorry] || 'unknown'}
- Their budgeting history: ${triedMap[triedBefore] || 'unknown'}
- Monthly income: $${totalIncome}
- Monthly expenses: $${totalExpenses}
- Monthly ${gap >= 0 ? 'surplus' : 'shortfall'}: $${Math.abs(gap)}
- Spending rate: ${pct}% of income
- Foundation spending (non-negotiables): $${foundationTotal} (${totalIncome > 0 ? Math.round((foundationTotal / totalIncome) * 100) : 0}% of income)
- Lifestyle spending (flexible): $${lifestyleTotal} (${lifestylePct}% of income)
- ${topCategoriesText}
- Months they have been tracking: ${monthsTracked || 1}

Write ONE paragraph of 4-6 sentences. Do not use bullet points or headers. 

Your paragraph should:
1. Acknowledge where they are emotionally without being condescending
2. Name one specific thing that stands out in their numbers — something honest, not sugar-coated
3. Ask them one question that makes them think about the behavior behind the number — not tell them what to do
4. End with something true and grounding, not motivational fluff

Do not say things like "great job", "you should be proud", or "you're doing amazing". Do not recommend specific financial products. Do not use the word "journey". Keep it under 120 words.`

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