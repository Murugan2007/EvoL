import { requireMaker } from "@/lib/auth";
import { ProductForm } from "./ProductForm";

export const metadata = { title: "Add product" };

export default async function NewProduct() {
  const me = await requireMaker();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Add a product</h1>
      <ProductForm userId={me.id} />
    </div>
  );
}
