export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  photoUrl?: string;
  supplierId?: string;
  brandId?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpfCnpj: string;
  address: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  address?: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id:string;
  items: SaleItem[];
  total: number;
  discount: number;
  paymentMethod: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'a_prazo';
  date: string;
  clientId?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Purchase {
  id: string;
  items: PurchaseItem[];
  total: number;
  supplierId: string;
  date: string;
}

export interface AccountReceivable {
  id: string;
  saleId: string;
  clientId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  paidDate?: string;
}

export interface AppSettings {
  appName: string;
  logoUrl: string;
}

export interface Brand {
  id: string;
  name: string;
}
