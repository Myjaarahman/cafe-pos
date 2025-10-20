export type MenuItem = {
  id: string;
  name: string;
  price: number | string;
  category: string;
  temp: string | null;
  active: boolean;
  sort_order: number;
};

export type CartItem = {
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

export type Order = {
  id: string;
  order_number: number;
  total: number | string;
  status: 'active' | 'served';
  created_at: string;
  order_items: {
    id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    menu_items?: { name: string } | null;
  }[];
};
