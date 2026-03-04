import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

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

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Solid Financial Habits',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    })

    return Response.json({ link_token: response.data.link_token })
  } catch (error) {
    console.error('Plaid link token error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}