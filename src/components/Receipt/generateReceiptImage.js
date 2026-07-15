import { toPng } from "html-to-image";

export async function shareOrDownloadImage(node, filename) {
  // pixelRatio forces a high-resolution render regardless of the on-screen
  // CSS size of the card - without it the exported PNG matches the modal's
  // small display size 1:1, which looks blurry/pixelated once shared.
  const dataUrl = await toPng(node, {
    pixelRatio: Math.max(3, window.devicePixelRatio || 1),
    backgroundColor: "#ffffff",
  });

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
