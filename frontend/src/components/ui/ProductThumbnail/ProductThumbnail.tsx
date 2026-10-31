/* eslint-disable @next/next/no-img-element */
import { ImageOff } from "lucide-react";
import { useState } from "react";

import styles from "./ProductThumbnail.module.css";

type ProductThumbnailProps = { src?: string | null; name: string; size?: "small" | "medium" | "large" };

/** Image externe servie par l'API : l'élément HTML évite une configuration d'hôtes Next fragile hors ligne. */
export function ProductThumbnail({ src, name, size = "medium" }: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return <span className={`${styles.frame} ${styles[size]}`}>{showImage ? <img src={src ?? undefined} alt={`Photo de ${name}`} onError={() => setFailed(true)} /> : <><ImageOff aria-hidden="true" size={size === "large" ? 24 : 18}/><span className="sr-only">Aucune photo pour {name}</span></>}</span>;
}
