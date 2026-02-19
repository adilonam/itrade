-- Rename enum value CLOSED to APPROVED (PostgreSQL 10+)
ALTER TYPE "WithdrawRequestStatus" RENAME VALUE 'CLOSED' TO 'APPROVED';
