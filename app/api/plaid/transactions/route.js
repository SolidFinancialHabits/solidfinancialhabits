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

// Categories that are not real spending — filter these out
const EXCLUDED_CATEGORIES = [
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'TRANSFER',
  'Transfer',
  'LOAN_PAYMENTS',
  'BANK_FEES',
  'OTHER',
  'Payment',
  'Credit Card',
  'INCOME',
  'Payroll',
  'Interest Earned',
  'Deposit',
]

export async function POST(request) {
  try {
    const { userId } = await request.json()

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

    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const response = await plaidClient.transactionsGet({
      access_token: connection.access_token,
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    })

    const transactions = response.data.transactions

    // Filter to real spending only
    const spendingTransactions = transactions.filter(txn => {
      if (txn.amount <= 0) return false // skip refunds and income

      const primaryCategory = txn.personal_finance_category?.primary || txn.category?.[0] || ''

      // Skip transfers, payments, and non-spending categories
      if (EXCLUDED_CATEGORIES.some(cat =>
        primaryCategory.toUpperCase().includes(cat.toUpperCase()) ||
        cat.toUpperCase().includes(primaryCategory.toUpperCase())
      )) return false

      return true
    })

    // Group by category and sum amounts
    const categoryTotals = {}
    spendingTransactions.forEach(txn => {
      const category = txn.personal_finance_category?.primary || txn.category?.[0] || 'Other'
      if (!categoryTotals[category]) categoryTotals[category] = { total: 0, transactions: [] }
      categoryTotals[category].total += txn.amount
      categoryTotals[category].transactions.push({
        name: txn.merchant_name || txn.name,
        amount: Math.round(txn.amount * 100) / 100,
        date: txn.date
      })
    })

    // Sort by amount and get top categories
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6)
      .map(([category, data]) => ({
        category: formatCategory(category),
        amount: Math.round(data.total),
        transactions: data.transactions
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5) // top 5 transactions per category
      }))

    const totalSpending = spendingTransactions.reduce((sum, t) => sum + t.amount, 0)

    return Response.json({
      topCategories,
      totalSpending: Math.round(totalSpending),
      transactionCount: spendingTransactions.length,
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
    'GOVERNMENT_AND_NON_PROFIT': '🏛️ Government',
    'HOME_IMPROVEMENT': '🔨 Home Improvement',
    'PETS': '🐾 Pets',
    'EDUCATION': '📚 Education',
    'Food and Drink': '🍕 Food & Dining',
    'Shops': '🛍️ Shopping',
    'Travel': '🚗 Transportation',
    'Recreation': '🎬 Entertainment',
    'Healthcare': '🏥 Medical',
    'Service': '💆 Services',
  }
  return map[raw] || '📦 ' + raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}