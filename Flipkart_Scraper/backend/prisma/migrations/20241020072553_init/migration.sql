/*
  Warnings:

  - You are about to drop the column `purchases` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `PriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `url` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "purchases",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "url" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "reviews" SET DEFAULT 0;

-- DropTable
DROP TABLE "PriceHistory";

-- CreateIndex
CREATE INDEX "Product_url_idx" ON "Product"("url");
