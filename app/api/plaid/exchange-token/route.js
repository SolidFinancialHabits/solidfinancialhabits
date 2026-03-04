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
    const { publicToken, userId, institutionName } = await request.json()

    console.log('Exchange token called for userId:', userId)

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    console.log('Got access token:', !!accessToken)
    console.log('Got item ID:', !!itemId)
    console.log('Service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + '...')

    // Save to Supabase using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase.from('plaid_connections').insert({
      user_id: userId,
      access_token: accessToken,
      item_id: itemId,
      institution_name: institutionName
    })

    console.log('Supabase insert data:', data)
    console.log('Supabase insert error:', error)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Exchange token error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}