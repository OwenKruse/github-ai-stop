CREATE TABLE `activity_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contributor_id` integer NOT NULL,
	`repository_id` integer NOT NULL,
	`pr_title` text NOT NULL,
	`pr_number` integer NOT NULL,
	`action` text NOT NULL,
	`trust_score_at_time` real NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`contributor_id`) REFERENCES `contributors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contributors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_id` integer NOT NULL,
	`username` text NOT NULL,
	`avatar_url` text NOT NULL,
	`trust_score` real DEFAULT 50 NOT NULL,
	`total_prs` integer DEFAULT 0 NOT NULL,
	`merged_prs` integer DEFAULT 0 NOT NULL,
	`account_age` real DEFAULT 0 NOT NULL,
	`is_whitelisted` integer DEFAULT false NOT NULL,
	`is_blocked` integer DEFAULT false NOT NULL,
	`last_active_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contributors_github_id_unique` ON `contributors` (`github_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `contributors_username_unique` ON `contributors` (`username`);--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_id` integer NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL,
	`full_name` text NOT NULL,
	`trust_threshold` integer DEFAULT 65 NOT NULL,
	`auto_close` integer DEFAULT true NOT NULL,
	`auto_label` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`installed_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repositories_github_id_unique` ON `repositories` (`github_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `repositories_full_name_unique` ON `repositories` (`full_name`);