-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PHARMACIST', 'PHARMACY_OWNER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "cvUrl" TEXT,
    "bio" TEXT,
    "experience" TEXT,
    "education" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyOwnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pharmacyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'none',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyOwnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "isNearExpiry" BOOLEAN NOT NULL DEFAULT false,
    "expiryDate" TIMESTAMP(3),
    "imageUrl" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "pharmacyOwnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacistProfile_userId_key" ON "PharmacistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyOwnerProfile_userId_key" ON "PharmacyOwnerProfile"("userId");

-- AddForeignKey
ALTER TABLE "PharmacistProfile" ADD CONSTRAINT "PharmacistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyOwnerProfile" ADD CONSTRAINT "PharmacyOwnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_pharmacyOwnerId_fkey" FOREIGN KEY ("pharmacyOwnerId") REFERENCES "PharmacyOwnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
