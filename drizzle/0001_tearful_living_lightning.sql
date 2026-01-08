CREATE TABLE `active_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spreadsheetId` int NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(100),
	`cursorPosition` json,
	`lastHeartbeat` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `active_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spreadsheet_collaborators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spreadsheetId` int NOT NULL,
	`userId` int NOT NULL,
	`collaboratorRole` enum('viewer','editor','admin') NOT NULL DEFAULT 'viewer',
	`inviteStatus` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`inviteCode` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spreadsheet_collaborators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spreadsheet_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spreadsheetId` int NOT NULL,
	`userId` int NOT NULL,
	`changeType` enum('create','update','delete') NOT NULL,
	`previousData` json,
	`newData` json,
	`version` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spreadsheet_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spreadsheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`columns` json NOT NULL,
	`rows` json NOT NULL,
	`templateType` varchar(50),
	`version` int NOT NULL DEFAULT 1,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spreadsheets_id` PRIMARY KEY(`id`),
	CONSTRAINT `spreadsheets_shareId_unique` UNIQUE(`shareId`)
);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tutorialProgress` json,
	`completedTutorials` json,
	`badges` json,
	`quizData` json,
	`streakData` json,
	`totalLearningTime` int DEFAULT 0,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_progress_id` PRIMARY KEY(`id`)
);
