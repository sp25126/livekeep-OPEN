export type UserRole = 'admin' | 'manager' | 'maker' | 'checker';
export type VoucherType = 'sales_bill' | 'quotation' | 'credit_note';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email?: string;
  role: UserRole;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
  created_at: string;
  last_sign_in_at?: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface VoucherItem {
  item_name: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_item_amount: number;
}

export interface Voucher {
  id: string;
  organization_id: string;
  created_by?: string;
  voucher_number: string;
  voucher_type: VoucherType;
  party_name: string;
  party_gstin?: string;
  billing_address?: string;
  place_of_supply?: string;
  total_amount: number;
  tax_amount: number;
  status: PaymentStatus;
  approved_by?: string;
  irn_number?: string;
  eway_bill_no?: string;
  synced_to_tally?: boolean;
  tally_sync_error?: string;
  items?: VoucherItem[];
  created_at: string;
  updated_at: string;
}

export interface SalesFieldLog {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  logged_at: string;
}

export interface SystemAuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_name: string;
  entity_id?: string | null;
  ip_address?: string | null;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  created_at: string;
}

