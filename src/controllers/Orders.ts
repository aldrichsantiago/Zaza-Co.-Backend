import { Request, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, ordersToProducts, products, users } from "../db/schema";


interface createOrderRequest extends Request{
    phone: number,
    addressLine1: string,
    shippingAddress: string,
    city: string,
    state: string,
    country: string,
    zipCode: number,
    paymentMethod: 'visa' | 'mastercard' | 'paypal' | 'gcash' | 'maya',
    status: 'to_pack' | 'in_logistics' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled',
    shippingAmount: number,
    subtotal: number,
}


export const createOrder = async(req: Request , res: Response) => {
    const { username, phone, shippingAddress, addressLine1, city, state, country, zipCode, paymentMethod, status, shippingAmount, subtotal, productsArr } = req.body;
    
    const result = await db.select({
        id: users.id
    }).from(users).where(
        eq(users.username, username)
    );
    console.log(result);
    console.log(productsArr);
    

    await db.insert(orders).values({
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
    }).catch(error => console.log(error))

    const order = await db.select({
        order_no: orders.order_no
    }).from(orders).orderBy(desc(orders.createdAt)).where(
        eq(orders.userId, result[0].id)
    );

    

    for await (const product of productsArr) {

        await db.insert(ordersToProducts).values({
            orderId: order[0].order_no,
            productId: product.productId,
            userId: result[0].id,
            itemQuantity: product.productQuantity
        }).catch(error => console.log(error))

        const p:any = await db.select().from(products).where(eq(products.id, product.productId));

        await db.update(products).set({ 
            stocks: await p[0].stocks - product.productQuantity, 
            quantitySold: await p[0].quantitySold + product.productQuantity, 
        }).where(eq(products.id, product.productId));

    }


    
    return res.status(201).json({success:true, message: "Order has been placed"})
}

export const editProduct = async(req: Request, res: Response) => {
    try {
        const id  = Number(req.params.id)
        const { name, description, price, stocks, category } = req.body;

        const product = await db.select().from(products).where(eq(products.id, id)).limit(1);

        if(!product[0]) return res.sendStatus(204);

        await db.update(products).set({ 
            name: name, 
            description: description, 
            price: price, 
            stocks: stocks, 
            category: category
        }).where(eq(products.id, product[0].id));
        
    } catch (error) {
        console.log(error);
    }
    res.status(201).json({success: true, message: "Product details updated"});
}


export const deleteProduct = async(req: Request, res: Response) => {
    try {
        const id  = Number(req.params.id)
        const product = await db.select().from(products).where(eq(products.id, id)).limit(1);

        if(!product[0]) return res.sendStatus(204);
        
        await db.update(products).set({ isDeleted: true }).where(eq(products.id, product[0].id));

        return res.sendStatus(200);
        
    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
        
    }
    
}


export const getAllProductsByOrderId = async(req: Request, res: Response) => {
    const orderId = req.params.orderId;

    const result = await db.query.ordersToProducts.findMany({
        where: ((ordersToProducts: any, { eq }: any) => eq(ordersToProducts.orderId, orderId)),
        with: {
            products: {
                columns:{
                    isDeleted: false,
                    createdAt: false,
                }
            }
        }, 
    })
    return res.json(result);
}

export const getAllOrdersByUser = async(req: Request, res: Response) => {
    const username = req.params.username;

    const user = await db.select({
        id: users.id
    }).from(users).where(
        eq(users.username, username)
    );

    if(user[0] === undefined){
        res.status(300).json({
            success: false,
            message: "No User with that Username"
        })
    }

    const result = await db.query.ordersToProducts.findMany({
        where: ((ordersToProducts: any, { eq }: any) => eq(ordersToProducts.userId, user[0].id)),
        with: {
            orders: {
                with: {
                    user: {
                        columns:{
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
                columns:{
                    isDeleted: false,
                    createdAt: false,
                }
            }
        }, 
    })
    return res.json(result);
}

export const getAllOrders = async(req: Request, res: Response) => {

    const result = await db.query.ordersToProducts.findMany({
        // where: ((ordersToProducts: any, { eq }: any) => eq(orders.order_no, 2)),
        with: {
            users: {
                columns:{
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                }
            },
            orders: {
                columns:{
                    createdAt: false,
                }
            },
            products: {
                columns:{
                    isDeleted: false,
                    createdAt: false,
                }
            }
        }, 
    })

    return res.json(result);
}

export const getAllDistinctOrders = async(req: Request, res: Response) => {

    const result = await db.selectDistinct({
        orderId: ordersToProducts.orderId,
        firstName:users.firstName,
        lastName:users.lastName,
        email:users.email,
        subtotal:orders.subtotal,
        shippingAmount:orders.shippingAmount,
        shippingAddress:orders.shippingAddress,
        status:orders.status,
        paymentMethod:orders.paymentMethod,
        createdAt:orders.createdAt,

    }).from(orders)

    .innerJoin(ordersToProducts, eq(orders.order_no, ordersToProducts.orderId))
    .innerJoin(products, eq(ordersToProducts.productId, products.id))
    .innerJoin(users, eq(ordersToProducts.userId, users.id))

    return res.json(result);
}



export const editOrderStatus = async(req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        const order = await db.query.orders.findFirst({ where: ((orders:any, {eq}:any) => eq(orders.order_no, id)) })
        await db.update(orders).set({ status: status }).where(eq(orders.order_no, id));

        return res.json(order);

    } catch (error) {
        console.log(error);
    }
}

export const rateProduct = async(req: Request, res: Response) => {
    try {
        const orderId = Number(req.params.orderId);
        const productId = Number(req.params.productId);
        const { rating } = req.body;

        const order = await db.select().from(ordersToProducts).where(
            and(
                eq(ordersToProducts.orderId, orderId),
                eq(ordersToProducts.productId, productId)
            )
        ).limit(1)
        const product = await db.select().from(products).where(eq(products.id, productId)).limit(1)

        console.log(order);
        console.log(product);
        
        let newRating = Number(Number(product[0].ratings) + Number(rating));
        await db.update(ordersToProducts).set({ userRating:rating, isReviewed: true }).where(
            and(
                eq(ordersToProducts.orderId, orderId),
                eq(ordersToProducts.productId, productId)
            ));
        await db.update(products).set({ ratings: newRating }).where(eq(products.id, productId));


        return res.status(201).json({success: true, message: "Product has been Rated"});

    } catch (error) {
        console.log(error);
    }
    
}

export const countReviewers  = async(req: Request, res: Response) => {
    try {
        const productId = Number(req.params.productId);


        const countOfReviewers = await db.select({ count: sql<number>`count(*)` }).from(ordersToProducts).where(
            and(
                eq(ordersToProducts.productId, productId),
                eq(ordersToProducts.isReviewed, true)
            )
        )        
        return res.status(201).json(countOfReviewers);

    } catch (error) {
        console.log(error);
    }
    
}

export const countOrdersProductsUsers  = async(req: Request, res: Response) => {
    try {
        const sales = await db.select().from(orders)

        const totalProfits = sales.reduce((accumulator, order) => accumulator + order?.subtotal, 0) 


        const countOfOrders = await db.select({ orderCount: sql<number>`count(*)` }).from(orders)
        const countOfProducts = await db.select({ productCount: sql<number>`count(*)` }).from(products).where(eq(products.isDeleted, false))
        const countOfUsers = await db.select({ userCount: sql<number>`count(*)` }).from(users).where(eq(users.isDeleted, false))
        
        return res.status(201).json([...countOfOrders, ...countOfProducts, ...countOfUsers, {totalSales:totalProfits}]);

    } catch (error) {
        console.log(error);
    }
    
}