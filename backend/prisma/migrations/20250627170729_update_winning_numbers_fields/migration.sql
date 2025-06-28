/*
  Warnings:

  - Added the required column `bonusNumber` to the `winning_numbers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstWinningAmount` to the `winning_numbers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "winning_numbers" ADD COLUMN     "bonusNumber" INTEGER NOT NULL,
ADD COLUMN     "firstWinningAmount" BIGINT NOT NULL;
