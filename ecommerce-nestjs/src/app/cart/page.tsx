import { getCart } from "@/lib/db/cart";
import CartEntry from "./CartEntry";
import { setProductQuantity } from "./actions";
import { formatPrice } from "@/lib/format";

export const metadata = {
  title: "YOur Cart -Kupresamazon",
};

export default async function CartPage() {
  const cart = await getCart();

  return (
    <div>
      <h1 className="bg-6 text-3xl font-bold">Shopping cart</h1>
      {cart?.items.map((cartItem) => (
        <CartEntry
          cartItem={cartItem}
          key={cartItem.id}
          setProductQuantity={setProductQuantity}
        />
      ))}

      {!cart?.items.length && <p>Your cart is empty</p>}
      <div className="flex flex-col items-end sm:items-center">
        <p className="mb-3 font-bold">
          Total:{formatPrice(cart?.subtotal || 0)}
        </p>
        <button className="btn - btn-primary sm:w-[200px]">Chekout</button>
      </div>
    </div>
  );
}
