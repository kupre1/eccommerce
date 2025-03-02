"use server";

import { createCart, getCart } from "@/lib/db/cart";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function IncrementProductQuantity(productId: string) {
  const cart = (await getCart()) ?? (await createCart());

  const articleInCart = cart.items.find((item) => item.productId === productId);

  if (articleInCart) {
  await prisma.carts.update({
    where :{id: cart.id},
    data:{items:{update: {
      where: { id: articleInCart.id },
      data: { quantity: { increment: 1 } },
    }}}
  })


    
  } else {
  await prisma.carts.update({
    where:{id:cart.id},
    data:{ items : {
      create:{
       
        productId,
        quantity: 1,
      }
    }}
  })

   
  }

  revalidatePath("/products/[id]");
}
