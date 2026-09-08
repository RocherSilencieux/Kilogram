import fs from "fs";
import path from "path";
import sharp from "sharp";

const OUTPUT_DIR = path.join(__dirname, "..", "public", "seed-images");

const COLORS: [number, number, number][] = [
  [231, 76, 60],
  [230, 126, 34],
  [241, 196, 15],
  [46, 204, 113],
  [26, 188, 156],
  [52, 152, 219],
  [155, 89, 182],
  [52, 73, 94],
  [149, 165, 166],
  [211, 84, 0],
  [39, 174, 96],
  [41, 128, 185],
  [142, 68, 173],
  [44, 62, 80],
  [192, 57, 43],
  [22, 160, 133],
  [243, 156, 18],
  [127, 140, 141],
  [190, 30, 90],
  [15, 118, 110],
];

async function generateImages() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (let i = 0; i < COLORS.length; i++) {
    const [r, g, b] = COLORS[i];
    const index = String(i + 1).padStart(2, "0");
    const filePath = path.join(OUTPUT_DIR, `img-${index}.jpg`);

    await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r, g, b },
      },
    })
      .jpeg({ quality: 80 })
      .toFile(filePath);

    console.log(`Generated ${filePath}`);
  }
}

generateImages();
