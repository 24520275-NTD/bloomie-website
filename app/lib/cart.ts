"use client";

import { useSyncExternalStore } from "react";

const storageKey = "bloomie-cart-v1";
const changeEvent = "bloomie-cart-change";
const unavailable = Symbol("cart storage unavailable");
export const cartQuantityLimit = 99;

type Cart = Record<string, number>;

function decodeCart(raw: string): Cart {
  try {
    const saved: unknown = JSON.parse(raw || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      const entries = Object.entries(saved).flatMap(([id, quantity]) =>
        typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0
          ? [[id, Math.min(quantity, cartQuantityLimit)] as const]
          : [],
      );
      return Object.assign(Object.create(null) as Cart, Object.fromEntries(entries));
    }
  } catch {
    // A new cart can replace stale or malformed saved data.
  }
  return Object.create(null) as Cart;
}

function subscribe(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) listener();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, listener);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(storageKey) ?? "";
  } catch {
    return unavailable;
  }
}

export function useCart() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return {
    cart: decodeCart(typeof raw === "string" ? raw : ""),
    ready: raw !== null,
    storageUnavailable: raw === unavailable,
  };
}

export function changeCartQuantity(id: string, amount: number) {
  const cart = decodeCart(localStorage.getItem(storageKey) ?? "");
  const previous = cart[id] ?? 0;
  const quantity = Math.max(0, Math.min(cartQuantityLimit, previous + amount));

  if (quantity === previous) return false;
  if (quantity === 0) delete cart[id];
  else cart[id] = quantity;

  localStorage.setItem(storageKey, JSON.stringify(cart));
  window.dispatchEvent(new Event(changeEvent));
  return true;
}
