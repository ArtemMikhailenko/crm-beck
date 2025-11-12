-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "session" (
    "sid" VARCHAR(255) NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "session_expire_idx" ON "session"("expire");
