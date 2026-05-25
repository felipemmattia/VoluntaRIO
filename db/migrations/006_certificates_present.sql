-- Add "present" to enrollment status enum
ALTER TABLE `enrollments` MODIFY COLUMN `status` ENUM('pending','accepted','rejected','waitlist','cancelled','present') NOT NULL DEFAULT 'pending';

-- Create certificates table if not exists
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `volunteerId` BIGINT UNSIGNED NOT NULL,
  `eventId` BIGINT UNSIGNED NOT NULL,
  `certificateUrl` TEXT,
  `issuedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `hoursContributed` DECIMAL(5,2),
  `verificationCode` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `verificationCode` (`verificationCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
