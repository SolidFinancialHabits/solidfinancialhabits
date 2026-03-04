import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { createClient } from '@supabase/supabase-js'

const config = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    }
  }
})

const plaidClient = new PlaidApi(config)

export async function POST(request) {
  try {
    const { userId } = await request.json()

    // Get user's Plaid connection from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: connection } = await supabase
      .from('plaid_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!connection) {
      return Response.json({ error: 'No bank connected' }, { status: 404 })
    }

    // Get last 30 days of transactions
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const response = await plaidClient.transactionsGet({
      access_token: connection.access_token,
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    })

    const transactions = response.data.transactions

    // Group by category and sum amounts
    const categoryTotals = {}
    transactions.forEach(txn => {
      if (txn.amount <= 0) return // skip income/refunds
      const category = txn.personal_finance_category?.primary || txn.category?.[0] || 'Other'
      if (!categoryTotals[category]) categoryTotals[category] = 0
      categoryTotals[category] += txn.amount
    })

    // Sort by amount and get top categories
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, amount]) => ({
        category: formatCategory(category),
        amount: Math.round(amount)
      }))

    const totalSpending = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    return Response.json({
      topCategories,
      totalSpending: Math.round(totalSpending),
      transactionCount: transactions.filter(t => t.amount > 0).length,
      institutionName: connection.institution_name
    })

  } catch (error) {
    console.error('Plaid transactions error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

function formatCategory(raw) {
  const map = {
    'FOOD_AND_DRINK': '🍕 Food & Dining',
    'TRANSPORTATION': '🚗 Transportation',
    'SHOPPING': '🛍️ Shopping',
    'ENTERTAINMENT': '🎬 Entertainment',
    'PERSONAL_CARE': '💆 Personal Care',
    'MEDICAL': '🏥 Medical',
    'TRAVEL': '✈️ Travel',
    'UTILITIES': '💡 Utilities',
    'RENT_AND_UTILITIES': '🏠 Rent & Utilities',
    'GENERAL_MERCHANDISE': '🛒 General Shopping',
    'GROCERIES': '🛒 Groceries',
    'Food and Drink': '🍕 Food & Dining',
    'Shops': '🛍️ Shopping',
    'Travel': '🚗 Transportation',
    'Recreation': '🎬 Entertainment',
    'Healthcare': '🏥 Medical',
    'Service': '💆 Services',
  }
  return map[raw] || '📦 ' + raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}