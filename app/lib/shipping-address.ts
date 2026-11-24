export type ShippingAddress = {
  name: string;
  phone: string;
  address: string;
};

export const defaultShippingAddressKey = "default_shipping_address";

export function parseShippingAddress(value: unknown): ShippingAddress | null {
  if (!value || typeof value !== "object") return null;
  const fields = value as Partial<Record<keyof ShippingAddress, unknown>>;
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const phone = typeof fields.phone === "string" ? fields.phone.trim() : "";
  const address = typeof fields.address === "string" ? fields.address.trim() : "";

  if (!name || name.length > 120 || phone.length < 8 || phone.length > 25 || !address || address.length > 500) {
    return null;
  }
  return { name, phone, address };
}
