"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countOrdersProductsUsers = exports.countReviewers = exports.rateProduct = exports.editOrderStatus = exports.getAllDistinctOrders = exports.getAllOrders = exports.getAllOrdersByUser = exports.getAllProductsByOrderId = exports.deleteProduct = exports.editProduct = exports.createOrder = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const createOrder = async (req, res) => {
    const { username, phone, shippingAddress, addressLine1, city, state, country, zipCode, paymentMethod, status, shippingAmount, subtotal, productsArr } = req.body;
    const result = await db_1.db.select({
        id: schema_1.users.id
    }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
    console.log(result);
    console.log(productsArr);
    await db_1.db.insert(schema_1.orders).values({
        userId: result[0].id,
        phone,
        shippingAddress,
        city,
        state,
        country,
        zipCode,
        paymentMethod,
        status: "to_pack",
        shippingAmount,
        subtotal
    }).catch(error => console.log(error));
    const order = await db_1.db.select({
        order_no: schema_1.orders.order_no
    }).from(schema_1.orders).orderBy((0, drizzle_orm_1.desc)(schema_1.orders.createdAt)).where((0, drizzle_orm_1.eq)(schema_1.orders.userId, result[0].id));
    for await (const product of productsArr) {
        await db_1.db.insert(schema_1.ordersToProducts).values({
            orderId: order[0].order_no,
            productId: product.productId,
            userId: result[0].id,
            itemQuantity: product.productQuantity
        }).catch(error => console.log(error));
        const p = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, product.productId));
        await db_1.db.update(schema_1.products).set({
            stocks: await p[0].stocks - product.productQuantity,
            quantitySold: await p[0].quantitySold + product.productQuantity,
        }).where((0, drizzle_orm_1.eq)(schema_1.products.id, product.productId));
    }
    return res.status(201).json({ success: true, message: "Order has been placed" });
};
exports.createOrder = createOrder;
const editProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, description, price, stocks, category } = req.body;
        const product = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id)).limit(1);
        if (!product[0])
            return res.sendStatus(204);
        await db_1.db.update(schema_1.products).set({
            name: name,
            description: description,
            price: price,
            stocks: stocks,
            category: category
        }).where((0, drizzle_orm_1.eq)(schema_1.products.id, product[0].id));
    }
    catch (error) {
        console.log(error);
    }
    res.status(201).json({ success: true, message: "Product details updated" });
};
exports.editProduct = editProduct;
const deleteProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const product = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id)).limit(1);
        if (!product[0])
            return res.sendStatus(204);
        await db_1.db.update(schema_1.products).set({ isDeleted: true }).where((0, drizzle_orm_1.eq)(schema_1.products.id, product[0].id));
        return res.sendStatus(200);
    }
    catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }
};
exports.deleteProduct = deleteProduct;
const getAllProductsByOrderId = async (req, res) => {
    const orderId = req.params.orderId;
    const result = await db_1.db.query.ordersToProducts.findMany({
        where: ((ordersToProducts, { eq }) => eq(ordersToProducts.orderId, orderId)),
        with: {
            products: {
                columns: {
                    isDeleted: false,
                    createdAt: false,
                }
            }
        },
    });
    return res.json(result);
};
exports.getAllProductsByOrderId = getAllProductsByOrderId;
const getAllOrdersByUser = async (req, res) => {
    const username = req.params.username;
    const user = await db_1.db.select({
        id: schema_1.users.id
    }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
    if (user[0] === undefined) {
        res.status(300).json({
            success: false,
            message: "No User with that Username"
        });
    }
    const result = await db_1.db.query.ordersToProducts.findMany({
        where: ((ordersToProducts, { eq }) => eq(ordersToProducts.userId, user[0].id)),
        with: {
            orders: {
                with: {
                    user: {
                        columns: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            email: true,
                        }
                    },
                },
            },
            products: {
                columns: {
                    isDeleted: false,
                    createdAt: false,
                }
            }
        },
    });
    return res.json(result);
};
exports.getAllOrdersByUser = getAllOrdersByUser;
const getAllOrders = async (req, res) => {
    const result = await db_1.db.query.ordersToProducts.findMany({
        // where: ((ordersToProducts: any, { eq }: any) => eq(orders.order_no, 2)),
        with: {
            users: {
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                }
            },
            orders: {
                columns: {
                    createdAt: false,
                }
            },
            products: {
                columns: {
                    isDeleted: false,
                    createdAt: false,
                }
            }
        },
    });
    return res.json(result);
};
exports.getAllOrders = getAllOrders;
const getAllDistinctOrders = async (req, res) => {
    const result = await db_1.db.selectDistinct({
        orderId: schema_1.ordersToProducts.orderId,
        firstName: schema_1.users.firstName,
        lastName: schema_1.users.lastName,
        email: schema_1.users.email,
        subtotal: schema_1.orders.subtotal,
        shippingAmount: schema_1.orders.shippingAmount,
        shippingAddress: schema_1.orders.shippingAddress,
        status: schema_1.orders.status,
        paymentMethod: schema_1.orders.paymentMethod,
        createdAt: schema_1.orders.createdAt,
    }).from(schema_1.orders)
        .innerJoin(schema_1.ordersToProducts, (0, drizzle_orm_1.eq)(schema_1.orders.order_no, schema_1.ordersToProducts.orderId))
        .innerJoin(schema_1.products, (0, drizzle_orm_1.eq)(schema_1.ordersToProducts.productId, schema_1.products.id))
        .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.ordersToProducts.userId, schema_1.users.id));
    return res.json(result);
};
exports.getAllDistinctOrders = getAllDistinctOrders;
const editOrderStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        const order = await db_1.db.query.orders.findFirst({ where: ((orders, { eq }) => eq(orders.order_no, id)) });
        await db_1.db.update(schema_1.orders).set({ status: status }).where((0, drizzle_orm_1.eq)(schema_1.orders.order_no, id));
        return res.json(order);
    }
    catch (error) {
        console.log(error);
    }
};
exports.editOrderStatus = editOrderStatus;
const rateProduct = async (req, res) => {
    try {
        const orderId = Number(req.params.orderId);
        const productId = Number(req.params.productId);
        const { rating } = req.body;
        const order = await db_1.db.select().from(schema_1.ordersToProducts).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ordersToProducts.orderId, orderId), (0, drizzle_orm_1.eq)(schema_1.ordersToProducts.productId, productId))).limit(1);
        const product = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, productId)).limit(1);
        console.log(order);
        console.log(product);
        let newRating = Number(Number(product[0].ratings) + Number(rating));
        await db_1.db.update(schema_1.ordersToProducts).set({ userRating: rating, isReviewed: true }).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ordersToProducts.orderId, orderId), (0, drizzle_orm_1.eq)(schema_1.ordersToProducts.productId, productId)));
        await db_1.db.update(schema_1.products).set({ ratings: newRating }).where((0, drizzle_orm_1.eq)(schema_1.products.id, productId));
        return res.status(201).json({ success: true, message: "Product has been Rated" });
    }
    catch (error) {
        console.log(error);
    }
};
exports.rateProduct = rateProduct;
const countReviewers = async (req, res) => {
    try {
        const productId = Number(req.params.productId);
        const countOfReviewers = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.ordersToProducts).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ordersToProducts.productId, productId), (0, drizzle_orm_1.eq)(schema_1.ordersToProducts.isReviewed, true)));
        return res.status(201).json(countOfReviewers);
    }
    catch (error) {
        console.log(error);
    }
};
exports.countReviewers = countReviewers;
const countOrdersProductsUsers = async (req, res) => {
    try {
        const sales = await db_1.db.select().from(schema_1.orders);
        const totalProfits = sales.reduce((accumulator, order) => accumulator + order?.subtotal, 0);
        const countOfOrders = await db_1.db.select({ orderCount: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.orders);
        const countOfProducts = await db_1.db.select({ productCount: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.isDeleted, false));
        const countOfUsers = await db_1.db.select({ userCount: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.isDeleted, false));
        return res.status(201).json([...countOfOrders, ...countOfProducts, ...countOfUsers, { totalSales: totalProfits }]);
    }
    catch (error) {
        console.log(error);
    }
};
exports.countOrdersProductsUsers = countOrdersProductsUsers;
