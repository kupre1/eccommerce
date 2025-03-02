import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { cartitems, carts, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { randomUUID } from "crypto"; // იყენებს უნიკალური ID-სთვის

export type CartWithProducts = Prisma.cartsGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export type CartItemWithProduct = Prisma.cartitemsGetPayload<{
  include: { product: true };
}>;

export type ShoppingCart = CartWithProducts & {
  size: number;
  subtotal: number;
};

/**
 * 🛒 მომხმარებლის კალათის მიღება (თუ არსებობს)
 */
export async function getCart(): Promise<ShoppingCart | null> {
  const session = await getServerSession(authOptions);
  let cart: CartWithProducts | null = null;

  if (session) {
    cart = await prisma.carts.findFirst({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
    });
  } else {
    const localCartId = (await cookies()).get("localCartId")?.value;

    console.log("localCartId:", localCartId); // Debugging

    if (!localCartId) {
      console.log("No localCartId found");
      return null;
    }

    cart = await prisma.carts.findUnique({
      where: { id: localCartId },
      include: { items: { include: { product: true } } },
    });
  }

  if (!cart) return null;

  return {
    ...cart,
    size: cart.items.reduce((acc, item) => acc + item.quantity, 0),
    subtotal: cart.items.reduce(
      (acc, item) => acc + item.quantity * item.product.price,
      0
    ),
  };
}


export async function createCart(): Promise<ShoppingCart> {
  const session = await getServerSession(authOptions);
  let newCart: carts;

  if (session) {
    newCart = await prisma.carts.create({
      data: { userId: session.user.id },
    });
  } else {
    const localCartId = randomUUID(); 

    newCart = await prisma.carts.create({
      data: {
        user: { connect: { id: "local" } },
        createdAT: new Date(),
        updatedAT: new Date(),
      },
    });

    (await cookies()).set("localCartId", localCartId);
  }

  return {
    ...newCart,
    items: [],
    size: 0,
    subtotal: 0,
  };
}

export async function mergeAnonymousCartIntoUserCart(userId: string) {
  const localCartId = (await cookies()).get("localCartId")?.value;

  if (!localCartId) {
    console.log("No localCartId found.");
    return;
  }

  const localCart = await prisma.carts.findUnique({
    where: { id: localCartId },
    include: { items: true },
  });

  if (!localCart) return;

  const userCart = await prisma.carts.findFirst({
    where: { userId },
    include: { items: true },
  });

  await prisma.$transaction(async (tx) => {
    if (userCart) {
      const mergedCartItems = mergeCartItems(userCart.items, localCart.items);

      await tx.cartitems.deleteMany({
        where: { cartId: userCart.id },
      });

 await  tx.carts.update({
  where:{id:userCart.id},
  data:{
    items:{
      createMany:{
        data: mergedCartItems.map((item) => ({
         
          productId: item.productId,
          quantity: item.quantity,
        })),
      }
    }
  }
 })


   
    } else {
      await tx.carts.create({
        data: {
          userId,
          items: {
            createMany: {
              data: localCart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
          },
        },
      });
    }

    await tx.carts.delete({
      where: { id: localCart.id },
    });

    (await cookies()).set("localCartId", "");
  });
}

/**
 * 🔄 კალათის ელემენტების შერწყმა (თუ ერთი და იგივე პროდუქტია, რაოდენობა იზრდება)
 */
function mergeCartItems(...cartItems: cartitems[][]) {
  return cartItems.reduce((acc, items) => {
    items.forEach((item) => {
      const existing = acc.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
    });
    return acc;
  }, [] as cartitems[]);
}
