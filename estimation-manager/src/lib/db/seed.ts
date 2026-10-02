import "dotenv/config";
import { db } from "./client";
import { calibrationProfiles } from "./schema";
import { STANDARD_2026_PROFILE } from "./seed-profile";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existing = await db
    .select()
    .from(calibrationProfiles)
    .where(eq(calibrationProfiles.isActive, true))
    .limit(1);

  if (existing.length > 0) {
    console.log("Active calibration profile already exists — skipping seed.");
    process.exit(0);
  }

  const { name, version, ...coefficients } = STANDARD_2026_PROFILE;

  await db.insert(calibrationProfiles).values({
    name,
    version,
    isActive: true,
    coefficients,
  });

  console.log(`Inserted calibration profile: "${name}" (v${version}, active).`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
