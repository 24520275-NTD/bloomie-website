"use client";

import { useSyncExternalStore } from "react";
import { createClient, hasSupabaseConfig } from "./supabase-browser";

const guestKey = "bloomie-cart-v2:guest";
const userPrefix = "bloomie-cart-v2:user:";
const changeEvent = "bloomie-cart-change";
const unavailable = Symbol("cart storage unavailable");

export const cartQuantityLimit = 99;

type Cart = Record<string, number>;

let activeKey: string | null = hasSupabaseConfig ? null : guestKey;
let authStarted = false;

function startAuthListener() {
  if (authStarted || !hasSupabaseConfig) return;
  authStarted = true;

  const supabase = createClient();
  supabase.auth.onAuthStateChange((_event, session) => {
    const nextKey = session?.user.id
      ? `${userPrefix}${session.user.id}`
      : guestKey;

    if (activeKey !== nextKey) {
      activeKey = nextKey;
      window.dispatchEvent(new Event(changeEvent));
    }
  });
}

function decodeCart(raw: string): Cart {
  const cart = Object.create(null) as Cart;

  try {
    const saved: unknown = JSON.parse(raw || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [id, quantity] of Object.entries(saved)) {
        if (typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0) {
          cart[id] = Math.min(quantity, cartQuantityLimit);
        }
      }
    }
  } catch {
    // Nếu dữ liệu cũ bị hỏng, hiển thị giỏ trống.
  }

  return cart;
}

function subscribe(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === activeKey || event.key === null) listener();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, listener);
  startAuthListener();

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, listener);
  };
}

function getSnapshot() {
  const key = activeKey;
  if (!key) return null;

  try {
    return `${key}\n${localStorage.getItem(key) ?? ""}`;
  } catch {
    return unavailable;
  }
}

export function getCartOwnerId() {
  return activeKey?.startsWith(userPrefix)
    ? activeKey.slice(userPrefix.length)
    : null;
}

function updateCart(key: string | null, id: string, amount: number) {
  if (!key || key !== activeKey) {
    throw new Error("Phiên giỏ hàng đã thay đổi.");
  }

  const cart = decodeCart(localStorage.getItem(key) ?? "");
  const previous = cart[id] ?? 0;
  const quantity = Math.max(0, Math.min(cartQuantityLimit, previous + amount));

  if (quantity === previous) return false;

  if (quantity === 0) delete cart[id];
  else cart[id] = quantity;

  localStorage.setItem(key, JSON.stringify(cart));
  window.dispatchEvent(new Event(changeEvent));
  return true;
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const separator = typeof snapshot === "string" ? snapshot.indexOf("\n") : -1;
  const key = typeof snapshot === "string" ? snapshot.slice(0, separator) : null;
  const raw = typeof snapshot === "string" ? snapshot.slice(separator + 1) : "";

  return {
    cart: decodeCart(raw),
    ownerId: key?.startsWith(userPrefix) ? key.slice(userPrefix.length) : null,
    ready: snapshot !== null,
    storageUnavailable: snapshot === unavailable,
    changeCartQuantity: (id: string, amount: number) => updateCart(key, id, amount),
  };
}