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

type Action =
  | { type: 'HYDRATE'; state: BasketState }
  | { type: 'ADD_ITEM'; item: Omit<BasketItem, 'quantity'> }
  | { type: 'SET_QUANTITY'; id: string; quantity: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CLEAR' };

function reducer(state: BasketState, action: Action): BasketState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case 'SET_QUANTITY': {
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i,
        ),
      };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.id !== action.id) };
    case 'CLEAR':
      return EMPTY_BASKET;
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
  const [state, dispatch] = useReducer(reducer, EMPTY_BASKET);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BASKET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BasketState;
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'HYDRATE', state: parsed });
        }
      }
    } catch {
      // Corrupt or unavailable — start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded or disabled — in-memory fallback, no user-facing error.
    }
  }, [state, hydrated]);

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
    () => state.items.reduce((n, i) => n + i.quantity, 0),
    [state.items],
  );

  const value = useMemo<BasketContextValue>(
    () => ({
      state,
      hydrated,
      itemCount,
      addItem,
      setQuantity,
      removeItem,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [state, hydrated, itemCount, addItem, setQuantity, removeItem, clear, drawerOpen],
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
