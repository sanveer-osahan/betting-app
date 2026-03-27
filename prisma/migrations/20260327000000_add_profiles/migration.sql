-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- Add nullable profileId columns
ALTER TABLE "Player" ADD COLUMN "profileId" TEXT;
ALTER TABLE "Bet" ADD COLUMN "profileId" TEXT;
ALTER TABLE "User" ADD COLUMN "profileId" TEXT;

-- Insert Default profile
INSERT INTO "Profile" ("id", "name", "createdAt", "updatedAt")
VALUES ('default-profile-id', 'Default', NOW(), NOW());

-- Backfill existing rows
UPDATE "Player" SET "profileId" = 'default-profile-id';
UPDATE "Bet" SET "profileId" = 'default-profile-id';

-- Make Player.profileId and Bet.profileId NOT NULL
ALTER TABLE "Player" ALTER COLUMN "profileId" SET NOT NULL;
ALTER TABLE "Bet" ALTER COLUMN "profileId" SET NOT NULL;

-- Drop old unique index on Player.name
DROP INDEX IF EXISTS "Player_name_key";

-- Add composite unique index
CREATE UNIQUE INDEX "Player_name_profileId_key" ON "Player"("name", "profileId");

-- Add FK constraints
ALTER TABLE "Player" ADD CONSTRAINT "Player_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Bet" ADD CONSTRAINT "Bet_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
