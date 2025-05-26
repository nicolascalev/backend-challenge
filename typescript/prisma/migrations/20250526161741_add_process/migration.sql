-- CreateTable
CREATE TABLE "Process" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageAmount" INTEGER NOT NULL,
    "finishedProcessingAt" DATETIME,
    "createdById" INTEGER NOT NULL,
    CONSTRAINT "Process_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
