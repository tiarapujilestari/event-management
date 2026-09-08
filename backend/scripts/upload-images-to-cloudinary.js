"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = __importDefault(require("../src/config/cloudinary"));
const IMAGES_DIR = path_1.default.join(__dirname, "../../frontend/public/images");
const SEED_FILE = path_1.default.join(__dirname, "../prisma/seed.ts");
const SKIP_FILES = new Set(["default-event.svg"]);
async function main() {
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
        console.error("❌ Cloudinary credentials are not set in backend/.env.");
        process.exit(1);
    }
    if (!fs_1.default.existsSync(IMAGES_DIR)) {
        console.error(`❌ Folder not found: ${IMAGES_DIR}`);
        process.exit(1);
    }
    const files = fs_1.default
        .readdirSync(IMAGES_DIR)
        .filter((f) => !SKIP_FILES.has(f) && /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (files.length === 0) {
        console.log("No images found to upload.");
        return;
    }
    console.log(`Found ${files.length} image(s) to upload to Cloudinary...\n`);
    const uploadedMap = {};
    for (const file of files) {
        const filePath = path_1.default.join(IMAGES_DIR, file);
        const publicId = path_1.default.parse(file).name;
        try {
            process.stdout.write(`Uploading ${file}... `);
            const result = await cloudinary_1.default.uploader.upload(filePath, {
                folder: "events",
                public_id: publicId,
                overwrite: true,
            });
            uploadedMap[`/images/${file}`] = result.secure_url;
            console.log("✔ done");
        }
        catch (err) {
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
    if (!fs_1.default.existsSync(SEED_FILE)) {
        console.warn(`⚠ Could not find ${SEED_FILE}. URL mapping:\n`);
        console.log(JSON.stringify(uploadedMap, null, 2));
        return;
    }
    let seedContent = fs_1.default.readFileSync(SEED_FILE, "utf-8");
    fs_1.default.writeFileSync(SEED_FILE + ".bak", seedContent); // backup first
    let replacedCount = 0;
    for (const [localPath, cloudUrl] of Object.entries(uploadedMap)) {
        const before = seedContent;
        seedContent = seedContent.split(`"${localPath}"`).join(`"${cloudUrl}"`);
        seedContent = seedContent.split(`'${localPath}'`).join(`'${cloudUrl}'`);
        if (seedContent !== before)
            replacedCount++;
    }
    fs_1.default.writeFileSync(SEED_FILE, seedContent);
    console.log(`✅ Updated ${replacedCount} bannerUrl reference(s) in prisma/seed.ts`);
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
//# sourceMappingURL=upload-images-to-cloudinary.js.map