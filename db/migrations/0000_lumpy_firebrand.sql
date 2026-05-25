CREATE TABLE `categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`parentId` bigint unsigned,
	`icon` varchar(50),
	`color` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`eventId` bigint unsigned NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`status` enum('pending','accepted','rejected','waitlist','cancelled') NOT NULL DEFAULT 'pending',
	`position` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`eventId` bigint unsigned NOT NULL,
	`imageUrl` text NOT NULL,
	`caption` varchar(255),
	`isMain` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`ongId` bigint unsigned NOT NULL,
	`categoryId` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`requirements` text,
	`experienceLevel` enum('iniciante','intermediario','avancado','todos') NOT NULL DEFAULT 'todos',
	`eventDate` date NOT NULL,
	`eventTime` time,
	`duration` varchar(50),
	`city` varchar(100) NOT NULL,
	`state` varchar(2) NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`locationName` varchar(255),
	`address` text,
	`maxVolunteers` int NOT NULL,
	`status` enum('active','cancelled','completed','full') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`senderId` bigint unsigned NOT NULL,
	`receiverId` bigint unsigned NOT NULL,
	`eventId` bigint unsigned,
	`content` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
	`read` boolean NOT NULL DEFAULT false,
	`link` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ong_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`cnpj` varchar(18),
	`displayName` varchar(255) NOT NULL,
	`mission` text,
	`description` text,
	`website` varchar(255),
	`phone` varchar(20),
	`email` varchar(320),
	`city` varchar(100),
	`state` varchar(2),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`address` text,
	`autoAccept` boolean NOT NULL DEFAULT false,
	`status` enum('active','suspended','pending') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ong_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `ong_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `platform_stats` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`totalVolunteers` int NOT NULL DEFAULT 0,
	`totalOngs` int NOT NULL DEFAULT 0,
	`totalEvents` int NOT NULL DEFAULT 0,
	`totalEnrollments` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`avatar` text,
	`role` enum('user','admin','ong_manager') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `volunteer_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`bio` text,
	`phone` varchar(20),
	`city` varchar(100),
	`state` varchar(2),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`certifications` text,
	`experience` text,
	`interests` text,
	`shareLocation` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `volunteer_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `volunteer_profiles_userId_unique` UNIQUE(`userId`)
);
