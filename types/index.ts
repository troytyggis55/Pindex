import type { Database } from './supabase'

type Tables = Database['public']['Tables']

export type User = Tables['profiles']['Row']
export type Organization = Tables['organizations']['Row']
export type Pin = Tables['pins']['Row']
export type UserPin = Tables['user_pins']['Row']
export type Trade = Tables['trades']['Row']
export type TradeItem = Tables['trade_items']['Row']
export type Contact = Tables['contacts']['Row']
export type Follow = Tables['follows']['Row']
