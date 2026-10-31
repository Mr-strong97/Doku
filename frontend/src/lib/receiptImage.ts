type ReceiptLine = { name: string; quantity: number; lineTotal: string };

type ReceiptImage = {
  shopName: string;
  receiptNumber: string | null;
  createdAt: string;
  currency: "CDF" | "USD";
  total: string;
  items: ReceiptLine[];
};

const money = (value: string, currency: ReceiptImage["currency"]) => currency === "USD"
  ? `$ ${Number(value).toFixed(2)}`
  : `${new Intl.NumberFormat("fr-FR").format(Number(value))} FC`;

function wrappedLines(context: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Génère localement une image PNG partageable sans envoyer le reçu à un tiers. */
export async function createReceiptImage(receipt: ReceiptImage): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible");

  context.fillStyle = "#f6f8fb";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#0f7075";
  context.fillRect(0, 0, canvas.width, 310);
  context.fillStyle = "#ffffff";
  context.beginPath(); context.roundRect(70, 74, 132, 132, 30); context.fill();
  context.fillStyle = "#0f7075";
  context.font = "800 94px Arial";
  context.fillText("D", 103, 171);
  context.fillStyle = "#ffffff";
  context.font = "700 52px Arial";
  context.fillText("Doku", 232, 132);
  context.font = "400 30px Arial";
  context.fillStyle = "#d5f3ef";
  context.fillText("Reçu de vente", 234, 178);

  context.fillStyle = "#ffffff";
  context.beginPath(); context.roundRect(55, 258, 970, 930, 34); context.fill();
  let y = 365;
  context.fillStyle = "#10223a";
  context.font = "700 45px Arial";
  for (const line of wrappedLines(context, receipt.shopName, 820)) { context.fillText(line, 110, y); y += 54; }
  context.font = "400 28px Arial";
  context.fillStyle = "#557087";
  context.fillText(`Reçu ${receipt.receiptNumber ?? "sans numéro"}`, 110, y + 12);
  context.textAlign = "right";
  context.fillText(new Date(receipt.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }), 970, y + 12);
  context.textAlign = "left";
  y += 88;
  context.strokeStyle = "#dbe5ec"; context.lineWidth = 2; context.beginPath(); context.moveTo(110, y); context.lineTo(970, y); context.stroke(); y += 60;

  for (const item of receipt.items.slice(0, 8)) {
    context.fillStyle = "#10223a"; context.font = "600 30px Arial";
    const name = wrappedLines(context, `${item.quantity} × ${item.name}`, 590).slice(0, 2);
    name.forEach((line, index) => context.fillText(line, 110, y + index * 38));
    context.textAlign = "right"; context.font = "700 29px Arial"; context.fillText(money(item.lineTotal, receipt.currency), 970, y); context.textAlign = "left";
    y += Math.max(58, name.length * 38 + 22);
  }
  context.strokeStyle = "#dbe5ec"; context.beginPath(); context.moveTo(110, y); context.lineTo(970, y); context.stroke(); y += 85;
  context.fillStyle = "#10223a"; context.font = "700 35px Arial"; context.fillText("Total", 110, y);
  context.textAlign = "right"; context.fillStyle = "#0b5c61"; context.font = "800 52px Arial"; context.fillText(money(receipt.total, receipt.currency), 970, y); context.textAlign = "left";
  context.fillStyle = "#0f7075"; context.beginPath(); context.roundRect(110, 1080, 860, 1, 0); context.fill();
  context.fillStyle = "#557087"; context.font = "400 27px Arial"; context.textAlign = "center"; context.fillText("Merci pour votre achat · Doku", 540, 1250); context.textAlign = "left";

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Image du reçu indisponible");
  return new File([blob], `recu-${receipt.receiptNumber ?? "doku"}.png`, { type: "image/png" });
}

export async function shareReceiptImage(receipt: ReceiptImage): Promise<"shared" | "downloaded"> {
  const file = await createReceiptImage(receipt);
  const data = { title: "Reçu Doku", text: `Reçu ${receipt.receiptNumber ?? "Doku"}`, files: [file] };
  if (navigator.canShare?.(data)) { await navigator.share(data); return "shared"; }
  const url = URL.createObjectURL(file); const link = document.createElement("a");
  link.href = url; link.download = file.name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return "downloaded";
}
