export interface User {
  id: string;
  username: string;
  coins: number;
  total_earned: number;
  join_date: string;
  last_active: string;
  is_blocked: boolean;
  block_reason?: string;
}

export interface Task {
  id: number;
  title: string;
  reward: number;
  time_estimate: string;
  category: string;
  icon: string;
  active: number;
  link: string;
}

export interface Coupon {
  code: string;
  reward: number;
  usage_limit: number;
  used_count: number;
  expiry_date: string;
  active: boolean;
}

export interface Withdrawal {
  id: number;
  user_id: string;
  username?: string;
  amount: number;
  method: string;
  address: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
}

export interface AppSettings {
  withdrawals_enabled: string;
  min_withdrawal: string;
}
