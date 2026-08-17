/*
  Warnings:

  - You are about to drop the column `author` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `News` table. All the data in the column will be lost.
  - Added the required column `sourceUrl` to the `News` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "News" DROP COLUMN "author",
DROP COLUMN "source",
ADD COLUMN     "sourceUrl" TEXT NOT NULL;
