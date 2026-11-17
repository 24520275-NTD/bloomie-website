export type Product = {
  id: string;
  name: string;
  image: string;
  description: string;
  price_vnd: number | null;
};

export async function getProducts(): Promise<{
  products: Product[];
  error: string | null;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return {
      products: [],
      error: "Website chưa được cấu hình kết nối dữ liệu.",
    };
  }

  try {
    const endpoint = new URL("/rest/v1/products", url);
    endpoint.searchParams.set(
  "select",
  "id,name,image,description,price_vnd"
);
    endpoint.searchParams.set("is_active", "eq.true");
    endpoint.searchParams.set("order", "id.asc");

    const response = await fetch(endpoint, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error("Products request failed:", response.status);
      return {
        products: [],
        error: "Chưa tải được sản phẩm. Vui lòng thử lại sau.",
      };
    }

    const products: Product[] = await response.json();
    return { products, error: null };
  } catch {
    return {
      products: [],
      error: "Kết nối dữ liệu tạm thời gián đoạn. Vui lòng thử lại.",
    };
  }
}
