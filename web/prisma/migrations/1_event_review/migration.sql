-- Events now need an admin's approval before students can see them.
ALTER TABLE "public"."Event" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- Events that already exist were published before reviews existed: keep them live.
UPDATE "public"."Event" SET "status" = 'APPROVED', "reviewedAt" = CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "public"."Event"("status");
