export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category: string
  in_stock: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: number
  user_id: number
  items: OrderItem[]
  total: number
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  created_at: string
}

export interface OrderItem {
  product_id: number
  product_name: string
  price: number
  quantity: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type PaymentMethod = 'monobank' | 'telegram_stars'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  error: string | null
  success: boolean
}

export interface PaymentLink {
  payment_url: string
  invoice_id: string
}
