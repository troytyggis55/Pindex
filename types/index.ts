import type { Database } from './supabase'

type Tables = Database['public']['Tables']

export type User = Tables['profiles']['Row']
export type Association = Tables['associations']['Row']
export type Pin = Tables['pins']['Row']
export type UserPin = Tables['user_pins']['Row']
export type Trade = Tables['trades']['Row']
export type TradeItem = Tables['trade_items']['Row']
export type Follow = Tables['follows']['Row']