/*
  Warnings:

  - A unique constraint covering the columns `[sourceUrl]` on the table `News` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "News_sourceUrl_key" ON "News"("sourceUrl");
