export type BasketItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type BasketState = {
  items: BasketItem[];
};

export const EMPTY_BASKET: BasketState = { items: [] };

export const BASKET_STORAGE_KEY = 'salsala.basket.v1';
