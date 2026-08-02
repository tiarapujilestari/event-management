import "dotenv/config";
import fs from "fs";
import path from "path";
import cloudinary from "../src/config/cloudinary";

const IMAGES_DIR = path.join(__dirname, "../../frontend/public/images");
const SEED_FILE = path.join(__dirname, "../prisma/seed.ts");

const SKIP_FILES = new Set(["default-event.svg"]);

async function main() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name"
  ) {
    console.error("❌ Cloudinary credentials are not set in backend/.env.");
    process.exit(1);
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Folder not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => !SKIP_FILES.has(f) && /\.(jpg|jpeg|png|webp)$/i.test(f));

  if (files.length === 0) {
    console.log("No images found to upload.");
    return;
  }

  console.log(`Found ${files.length} image(s) to upload to Cloudinary...\n`);

  const uploadedMap: Record<string, string> = {};

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const publicId = path.parse(file).name;

    try {
      process.stdout.write(`Uploading ${file}... `);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "events",
        public_id: publicId,
        overwrite: true,
      });
      uploadedMap[`/images/${file}`] = result.secure_url;
      console.log("✔ done");
    } catch (err: any) {
      console.log("✘ FAILED");
      console.error(`   ${err.message || err}`);
    }
  }

  const successCount = Object.keys(uploadedMap).length;
  console.log(`\n${successCount}/${files.length} uploaded successfully.\n`);

  if (successCount === 0) {
    console.log("Nothing to update in seed.ts — no successful uploads.");
    return;
  }

  if (!fs.existsSync(SEED_FILE)) {
    console.warn(`⚠ Could not find ${SEED_FILE}. URL mapping:\n`);
    console.log(JSON.stringify(uploadedMap, null, 2));
    return;
  }

  let seedContent = fs.readFileSync(SEED_FILE, "utf-8");
  fs.writeFileSync(SEED_FILE + ".bak", seedContent); // backup first

  let replacedCount = 0;
  for (const [localPath, cloudUrl] of Object.entries(uploadedMap)) {
    const before = seedContent;
    seedContent = seedContent.split(`"${localPath}"`).join(`"${cloudUrl}"`);
    seedContent = seedContent.split(`'${localPath}'`).join(`'${cloudUrl}'`);
    if (seedContent !== before) replacedCount++;
  }

  fs.writeFileSync(SEED_FILE, seedContent);

  console.log(
    `✅ Updated ${replacedCount} bannerUrl reference(s) in prisma/seed.ts`,
  );
  console.log(`   (backup saved at prisma/seed.ts.bak)\n`);
  console.log("Next steps:");
  console.log("  1. Review prisma/seed.ts to confirm the URLs look right");
  console.log("  2. Run: npx prisma migrate reset");
}

main()
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
