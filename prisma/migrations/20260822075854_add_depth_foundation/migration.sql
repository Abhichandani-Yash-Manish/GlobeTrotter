/*
  Warnings:

  - Added the required column `slug` to the `City` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TripMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripMember_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripInvite_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripInvite_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" BLOB NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "altText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RouteSegmentCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCityId" TEXT NOT NULL,
    "toCityId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "geometry" TEXT NOT NULL,
    "distanceKm" REAL NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "duration" REAL NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "websiteUrl" TEXT,
    "bookingUrl" TEXT,
    "accessibility" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "imageCredit" TEXT,
    "imageSourceUrl" TEXT,
    "cityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("category", "cityId", "cost", "createdAt", "description", "duration", "id", "imageUrl", "name") SELECT "category", "cityId", "cost", "createdAt", "description", "duration", "id", "imageUrl", "name" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE INDEX "Activity_cityId_idx" ON "Activity"("cityId");
CREATE INDEX "Activity_category_idx" ON "Activity"("category");
CREATE TABLE "new_City" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "costIndex" REAL NOT NULL DEFAULT 3.0,
    "popularity" REAL NOT NULL DEFAULT 3.0,
    "description" TEXT,
    "imageUrl" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "bestSeason" TEXT,
    "idealDays" INTEGER,
    "timezone" TEXT,
    "currencyCode" TEXT,
    "dailyBudget" REAL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "imageCredit" TEXT,
    "imageSourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_City" ("costIndex", "country", "createdAt", "description", "id", "imageUrl", "latitude", "longitude", "name", "popularity", "region", "slug") SELECT "costIndex", "country", "createdAt", "description", "id", "imageUrl", "latitude", "longitude", "name", "popularity", "region", lower(replace("name", ' ', '-')) || '-' || lower(replace("country", ' ', '-')) FROM "City";
DROP TABLE "City";
ALTER TABLE "new_City" RENAME TO "City";
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");
CREATE INDEX "City_name_idx" ON "City"("name");
CREATE INDEX "City_country_idx" ON "City"("country");
CREATE INDEX "City_region_idx" ON "City"("region");
CREATE UNIQUE INDEX "City_name_country_key" ON "City"("name", "country");
CREATE TABLE "new_TripStop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "arrivalMode" TEXT NOT NULL DEFAULT 'train',
    "arrivalDurationMinutes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripStop_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TripStop" ("cityId", "createdAt", "endDate", "id", "notes", "order", "startDate", "tripId", "updatedAt") SELECT "cityId", "createdAt", "endDate", "id", "notes", "order", "startDate", "tripId", "updatedAt" FROM "TripStop";
DROP TABLE "TripStop";
ALTER TABLE "new_TripStop" RENAME TO "TripStop";
CREATE INDEX "TripStop_tripId_idx" ON "TripStop"("tripId");
CREATE INDEX "TripStop_cityId_idx" ON "TripStop"("cityId");
CREATE INDEX "TripStop_tripId_startDate_endDate_idx" ON "TripStop"("tripId", "startDate", "endDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TripMember_userId_idx" ON "TripMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripMember_tripId_userId_key" ON "TripMember"("tripId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripInvite_tokenHash_key" ON "TripInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "TripInvite_tripId_idx" ON "TripInvite"("tripId");

-- CreateIndex
CREATE INDEX "TripInvite_expiresAt_idx" ON "TripInvite"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_idx" ON "MediaAsset"("ownerId");

-- CreateIndex
CREATE INDEX "RouteSegmentCache_expiresAt_idx" ON "RouteSegmentCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RouteSegmentCache_fromCityId_toCityId_mode_provider_key" ON "RouteSegmentCache"("fromCityId", "toCityId", "mode", "provider");
