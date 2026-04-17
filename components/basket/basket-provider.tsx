'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  BASKET_STORAGE_KEY,
  EMPTY_BASKET,
  type BasketItem,
  type BasketState,
} from './types';

type InternalState = {
  basket: BasketState;
  hydrated: boolean;
};

const INITIAL_INTERNAL: InternalState = {
  basket: EMPTY_BASKET,
  hydrated: false,
};

type Action =
  | { type: 'HYDRATE'; basket: BasketState }
  | { type: 'ADD_ITEM'; item: Omit<BasketItem, 'quantity'> }
  | { type: 'SET_QUANTITY'; id: string; quantity: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CLEAR' };

function reducer(state: InternalState, action: Action): InternalState {
  switch (action.type) {
    case 'HYDRATE':
      return { basket: action.basket, hydrated: true };
    case 'ADD_ITEM': {
      const items = state.basket.items;
      const existing = items.find((i) => i.id === action.item.id);
      const nextItems = existing
        ? items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...items, { ...action.item, quantity: 1 }];
      return { ...state, basket: { items: nextItems } };
    }
    case 'SET_QUANTITY': {
      const items = state.basket.items;
      const nextItems =
        action.quantity <= 0
          ? items.filter((i) => i.id !== action.id)
          : items.map((i) =>
              i.id === action.id ? { ...i, quantity: action.quantity } : i,
            );
      return { ...state, basket: { items: nextItems } };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        basket: { items: state.basket.items.filter((i) => i.id !== action.id) },
      };
    case 'CLEAR':
      return { ...state, basket: EMPTY_BASKET };
    default:
      return state;
  }
}

type BasketContextValue = {
  state: BasketState;
  hydrated: boolean;
  itemCount: number;
  addItem: (item: Omit<BasketItem, 'quantity'>) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [internal, dispatch] = useReducer(reducer, INITIAL_INTERNAL);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let parsed: BasketState = EMPTY_BASKET;
    try {
      const raw = window.localStorage.getItem(BASKET_STORAGE_KEY);
      if (raw) {
        const maybe = JSON.parse(raw) as BasketState;
        if (maybe && Array.isArray(maybe.items)) parsed = maybe;
      }
    } catch {
      // Corrupt or unavailable — fall through with empty basket.
    }
    dispatch({ type: 'HYDRATE', basket: parsed });
  }, []);

  useEffect(() => {
    if (!internal.hydrated) return;
    try {
      window.localStorage.setItem(
        BASKET_STORAGE_KEY,
        JSON.stringify(internal.basket),
      );
    } catch {
      // Quota exceeded or disabled — in-memory fallback.
    }
  }, [internal.basket, internal.hydrated]);

  const addItem = useCallback(
    (item: Omit<BasketItem, 'quantity'>) => dispatch({ type: 'ADD_ITEM', item }),
    [],
  );
  const setQuantity = useCallback(
    (id: string, quantity: number) =>
      dispatch({ type: 'SET_QUANTITY', id, quantity }),
    [],
  );
  const removeItem = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_ITEM', id }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const itemCount = useMemo(
    () => internal.basket.items.reduce((n, i) => n + i.quantity, 0),
    [internal.basket.items],
  );

  const value = useMemo<BasketContextValue>(
    () => ({
      state: internal.basket,
      hydrated: internal.hydrated,
      itemCount,
      addItem,
      setQuantity,
      removeItem,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [
      internal.basket,
      internal.hydrated,
      itemCount,
      addItem,
      setQuantity,
      removeItem,
      clear,
      drawerOpen,
    ],
  );

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) {
    throw new Error('useBasket must be used inside <BasketProvider>');
  }
  return ctx;
}
