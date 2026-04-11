/*
  Warnings:

  - You are about to alter the column `category` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `job_type` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `salary` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `experience` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Job` DROP FOREIGN KEY `Job_hrId_fkey`;

-- AlterTable
ALTER TABLE `Job` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'เปิดรับสมัคร',
    MODIFY `title` VARCHAR(255) NOT NULL,
    MODIFY `category` VARCHAR(100) NOT NULL,
    MODIFY `job_type` VARCHAR(50) NOT NULL,
    MODIFY `location` VARCHAR(255) NOT NULL,
    MODIFY `salary` VARCHAR(100) NOT NULL,
    MODIFY `experience` VARCHAR(100) NOT NULL,
    MODIFY `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `google_id` VARCHAR(255) NULL,
    `github_id` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `fullName` VARCHAR(255) NULL,
    `avatar` VARCHAR(255) NULL,
    `roles_id` INTEGER NOT NULL,
    `status` ENUM('active', 'suspended', 'banned', 'pending') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `roles_id`(`roles_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seeker_profiles` (
    `user_id` INTEGER NOT NULL,
    `bio` TEXT NULL,
    `location` VARCHAR(255) NULL,
    `education` VARCHAR(255) NULL,
    `interests` VARCHAR(255) NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seeker_activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seeker_id` INTEGER NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hr_profiles` (
    `user_id` INTEGER NOT NULL,
    `company` VARCHAR(255) NULL,
    `bio` TEXT NULL,
    `website` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `industry` VARCHAR(100) NULL,
    `company_desc` TEXT NULL,
    `company_size` VARCHAR(50) NULL,
    `founded` VARCHAR(20) NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hr_activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hr_id` INTEGER NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `target_id` INTEGER NULL,
    `detail` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `admin_id`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resumes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(100) NULL DEFAULT 'My Resume',
    `template` VARCHAR(50) NULL DEFAULT 'modern',
    `visibility` ENUM('public', 'private') NULL DEFAULT 'private',
    `summary` TEXT NULL,
    `experience` JSON NULL,
    `education` JSON NULL,
    `skills` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `level` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `name`(`name`),
    UNIQUE INDEX `level`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL,
    `max_file_size` BIGINT NULL DEFAULT 10485760,
    `maintenance_mode` BOOLEAN NULL DEFAULT false,
    `max_resumes_per_user` INTEGER NOT NULL DEFAULT 5,
    `allow_registration` BOOLEAN NOT NULL DEFAULT true,
    `auto_approve_hr` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobId` INTEGER NOT NULL,
    `seekerId` INTEGER NOT NULL,
    `appliedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',

    INDEX `job_applications_jobId_idx`(`jobId`),
    INDEX `job_applications_seekerId_idx`(`seekerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roles_id_fkey` FOREIGN KEY (`roles_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `seeker_profiles` ADD CONSTRAINT `seeker_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seeker_activities` ADD CONSTRAINT `seeker_activities_seeker_id_fkey` FOREIGN KEY (`seeker_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hr_profiles` ADD CONSTRAINT `hr_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hr_activities` ADD CONSTRAINT `hr_activities_hr_id_fkey` FOREIGN KEY (`hr_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resumes` ADD CONSTRAINT `resumes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_hrId_fkey` FOREIGN KEY (`hrId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_seekerId_fkey` FOREIGN KEY (`seekerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Job` RENAME INDEX `Job_hrId_fkey` TO `hrId_idx`;
