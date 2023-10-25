import { relations } from 'drizzle-orm';
import { int, mysqlEnum, mysqlTable, timestamp, boolean, varchar, index, text, unique, float, json, primaryKey } from 'drizzle-orm/mysql-core';


export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  avatarImage: varchar('avatar_image', { length: 255 }),
  email: varchar('email', { length: 50 }),
  username: varchar('username', { length: 24 }).unique(),
  password: text('password'),
  cart: json('cart').default([]),
  wishlist: json('wishlist').$type<number[]>().default([]),
  role: mysqlEnum('role', ['admin', 'client']),
  refreshToken: text('refresh_token'),
  isActivated: boolean('is_activated'),
  isDeleted: boolean('is_deleted'),
  createdAt: timestamp('created_at').defaultNow(),
}, (users) =>({
  userNameIndex: index('username_index').on(users.username)
}));

export const products = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }),
  description: text('description'),
  price: int('price'),
  category: mysqlEnum('category', ['electronics', 'health-and-fitness', 'furnitures', 'accessories', 'clothing']),
  ratings: float('ratings'),
  images: json('images').$type<string[]>(),
  stocks: int('stocks'),
  quantitySold: int('quantitySold'),
  isDeleted: boolean('is_deleted'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = mysqlTable('orders', {
  order_no: int('order_no').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(()=> users.id),
  phone: varchar('phone_no',{length:15}),
  shippingAddress: varchar('shipping_address', {length: 254}),
  city: varchar('city', {length: 254}),
  state: varchar('state', {length: 254}),
  country: varchar('country', {length: 254}),
  zipCode: int('zip_code'),
  paymentMethod: mysqlEnum('payment_method', ['visa', 'mastercard', 'paypal', 'gcash', 'maya']),
  status: mysqlEnum('status', ['to_pack', 'in_logistics', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']),
  shippingAmount: float('shipping_amount').notNull(),
  subtotal: float('subtotal').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ordersToProducts = mysqlTable('orders_to_products', {
  orderId: int('order_no').notNull().references(() => orders.order_no),
  productId: int('product_id').notNull().references(() => products.id),
  userId: int('user_id').notNull().references(()=> users.id),
  itemQuantity: int('item_quantity').notNull(),
  isReviewed: boolean('is_reviewed').default(false),
  userRating: int('userRating').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey(t.orderId, t.productId),
}),
);

//RELATIONS
export const usersRelations = relations(users, ({ many }) => ({
	orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
	orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id],
	}),
}));

export const ordersToProductsRelations = relations(ordersToProducts, ({ one }) => ({
	orders: one(orders, {
		fields: [ordersToProducts.orderId],
		references: [orders.order_no],
	}),
  products: one(products, {
		fields: [ordersToProducts.productId],
		references: [products.id],
	}),
  users: one(users, {
		fields: [ordersToProducts.userId],
		references: [users.id],
	}),
}));