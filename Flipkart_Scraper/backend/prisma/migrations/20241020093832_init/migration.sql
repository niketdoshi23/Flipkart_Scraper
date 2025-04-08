/*
  Warnings:

  - You are about to drop the column `rawPrice` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[url]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "rawPrice",
ALTER COLUMN "reviews" DROP DEFAULT,
ALTER COLUMN "lastChecked" DROP DEFAULT,
ALTER COLUMN "rating" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_url_key" ON "Product"("url");
