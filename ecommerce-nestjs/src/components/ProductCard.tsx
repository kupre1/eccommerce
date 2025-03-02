import Link from "next/link";
import PriceTag from "./PriceTag";
import Image from "next/image";
import { products } from "@prisma/client";

interface ProductCardProps {
  product: products;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isNew =
    Date.now() - new Date(product.createdAT).getTime() <
    1000 * 60 * 60 * 24 * 7;

  return (
    <Link
      href={"/products/" + product.id}
      className="card w-full bg-base-100 hover:shadow-xl transition-shadow"
    >
      <figure>
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={800}
          height={400}
          className="h-48 object-cover "
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{product.name}</h2>
        <div>{isNew && <p className="badge badge-secondary">New</p>}</div>
        <p>{product.description}</p>
        <PriceTag price={product.price} />
      </div>
    </Link>
  );
}
