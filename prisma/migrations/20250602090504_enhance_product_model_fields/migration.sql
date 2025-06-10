-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "expectedLifespanYears" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "manualUrl" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchasePrice" DECIMAL(65,30),
ADD COLUMN     "warrantyMonths" INTEGER;
