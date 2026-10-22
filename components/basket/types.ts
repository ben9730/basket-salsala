export type BasketItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  fridayOnly?: boolean;
};

export type BasketState = {
  items: BasketItem[];
};

export const EMPTY_BASKET: BasketState = { items: [] };

export const BASKET_STORAGE_KEY = 'salsala.basket.v1';
