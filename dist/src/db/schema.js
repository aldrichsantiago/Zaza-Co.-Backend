"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersToProductsRelations = exports.ordersRelations = exports.productsRelations = exports.usersRelations = exports.ordersToProducts = exports.orders = exports.products = exports.users = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.users = (0, mysql_core_1.mysqlTable)('users', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    firstName: (0, mysql_core_1.varchar)('first_name', { length: 50 }),
    lastName: (0, mysql_core_1.varchar)('last_name', { length: 50 }),
    avatarImage: (0, mysql_core_1.varchar)('avatar_image', { length: 255 }),
    email: (0, mysql_core_1.varchar)('email', { length: 50 }),
    username: (0, mysql_core_1.varchar)('username', { length: 24 }).unique(),
    password: (0, mysql_core_1.text)('password'),
    cart: (0, mysql_core_1.json)('cart').default([]),
    wishlist: (0, mysql_core_1.json)('wishlist').$type().default([]),
    role: (0, mysql_core_1.mysqlEnum)('role', ['admin', 'client']),
    refreshToken: (0, mysql_core_1.text)('refresh_token'),
    isActivated: (0, mysql_core_1.boolean)('is_activated'),
    isDeleted: (0, mysql_core_1.boolean)('is_deleted'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
}, (users) => ({
    userNameIndex: (0, mysql_core_1.index)('username_index').on(users.username)
}));
exports.products = (0, mysql_core_1.mysqlTable)('products', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    name: (0, mysql_core_1.varchar)('name', { length: 50 }),
    description: (0, mysql_core_1.text)('description'),
    price: (0, mysql_core_1.int)('price'),
    category: (0, mysql_core_1.mysqlEnum)('category', ['electronics', 'health-and-fitness', 'furnitures', 'accessories', 'clothing']),
    ratings: (0, mysql_core_1.float)('ratings'),
    images: (0, mysql_core_1.json)('images').$type(),
    stocks: (0, mysql_core_1.int)('stocks'),
    quantitySold: (0, mysql_core_1.int)('quantitySold'),
    isDeleted: (0, mysql_core_1.boolean)('is_deleted'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
});
exports.orders = (0, mysql_core_1.mysqlTable)('orders', {
    order_no: (0, mysql_core_1.int)('order_no').autoincrement().primaryKey(),
    userId: (0, mysql_core_1.int)('user_id').notNull().references(() => exports.users.id),
    phone: (0, mysql_core_1.varchar)('phone_no', { length: 15 }),
    shippingAddress: (0, mysql_core_1.varchar)('shipping_address', { length: 254 }),
    city: (0, mysql_core_1.varchar)('city', { length: 254 }),
    state: (0, mysql_core_1.varchar)('state', { length: 254 }),
    country: (0, mysql_core_1.varchar)('country', { length: 254 }),
    zipCode: (0, mysql_core_1.int)('zip_code'),
    paymentMethod: (0, mysql_core_1.mysqlEnum)('payment_method', ['visa', 'mastercard', 'paypal', 'gcash', 'maya']),
    status: (0, mysql_core_1.mysqlEnum)('status', ['to_pack', 'in_logistics', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']),
    shippingAmount: (0, mysql_core_1.float)('shipping_amount').notNull(),
    subtotal: (0, mysql_core_1.float)('subtotal').notNull(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
});
exports.ordersToProducts = (0, mysql_core_1.mysqlTable)('orders_to_products', {
    orderId: (0, mysql_core_1.int)('order_no').notNull().references(() => exports.orders.order_no),
    productId: (0, mysql_core_1.int)('product_id').notNull().references(() => exports.products.id),
    userId: (0, mysql_core_1.int)('user_id').notNull().references(() => exports.users.id),
    itemQuantity: (0, mysql_core_1.int)('item_quantity').notNull(),
    isReviewed: (0, mysql_core_1.boolean)('is_reviewed').default(false),
    userRating: (0, mysql_core_1.int)('userRating').default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    pk: (0, mysql_core_1.primaryKey)(t.orderId, t.productId),
}));
//RELATIONS
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    orders: many(exports.orders),
}));
exports.productsRelations = (0, drizzle_orm_1.relations)(exports.products, ({ many }) => ({
    orders: many(exports.orders),
}));
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.orders.userId],
        references: [exports.users.id],
    }),
}));
exports.ordersToProductsRelations = (0, drizzle_orm_1.relations)(exports.ordersToProducts, ({ one }) => ({
    orders: one(exports.orders, {
        fields: [exports.ordersToProducts.orderId],
        references: [exports.orders.order_no],
    }),
    products: one(exports.products, {
        fields: [exports.ordersToProducts.productId],
        references: [exports.products.id],
    }),
    users: one(exports.users, {
        fields: [exports.ordersToProducts.userId],
        references: [exports.users.id],
    }),
}));
