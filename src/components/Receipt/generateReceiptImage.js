import { toPng } from "html-to-image";

export async function shareOrDownloadImage(node, filename) {
  const dataUrl = await toPng(node);

  if (navigator.canShare && navigator.share) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
