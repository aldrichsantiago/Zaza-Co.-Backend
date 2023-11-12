CREATE TABLE `orders` (
	`order_no` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`phone_no` varchar(15),
	`shipping_address` varchar(254),
	`city` varchar(254),
	`state` varchar(254),
	`country` varchar(254),
	`zip_code` int,
	`payment_method` enum('visa','mastercard','paypal','gcash','maya'),
	`status` enum('to_pack','in_logistics','shipped','out_for_delivery','delivered','cancelled'),
	`shipping_amount` float NOT NULL,
	`subtotal` float NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `orders_order_no` PRIMARY KEY(`order_no`)
);
--> statement-breakpoint
CREATE TABLE `orders_to_products` (
	`order_no` int NOT NULL,
	`product_id` int NOT NULL,
	`user_id` int NOT NULL,
	`item_quantity` int NOT NULL,
	`is_reviewed` boolean DEFAULT false,
	`userRating` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `orders_to_products_order_no_product_id` PRIMARY KEY(`order_no`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50),
	`description` text,
	`price` int,
	`category` enum('electronics','health-and-fitness','furnitures','accessories','clothing'),
	`ratings` float,
	`images` json,
	`stocks` int,
	`quantitySold` int,
	`is_deleted` boolean,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(50),
	`last_name` varchar(50),
	`avatar_image` varchar(255),
	`email` varchar(50),
	`username` varchar(24),
	`password` text,
	`cart` json DEFAULT ('[]'),
	`wishlist` json DEFAULT ('[]'),
	`role` enum('admin','client'),
	`refresh_token` text,
	`is_activated` boolean,
	`is_deleted` boolean,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE INDEX `username_index` ON `users` (`username`);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders_to_products` ADD CONSTRAINT `orders_to_products_order_no_orders_order_no_fk` FOREIGN KEY (`order_no`) REFERENCES `orders`(`order_no`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders_to_products` ADD CONSTRAINT `orders_to_products_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders_to_products` ADD CONSTRAINT `orders_to_products_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;