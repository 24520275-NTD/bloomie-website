import BloomieHome from "./components/bloomie-home";
import { getProducts } from "./lib/products";
import "./home.css";

export default async function Home() {
  const { products, error } = await getProducts();
  return <BloomieHome products={products} productError={error} />;
}
