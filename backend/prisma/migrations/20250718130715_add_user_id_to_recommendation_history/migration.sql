-- AlterTable
ALTER TABLE "recommendation_history" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "recommendation_history" ADD CONSTRAINT "recommendation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
