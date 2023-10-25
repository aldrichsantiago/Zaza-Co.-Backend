declare namespace Express {
    export interface Request {
        firstName: string,
        lastName: string,
        email: string,
        username: string,
        password: string,
        confPassword: string
    }

    export interface Request {
        name: string,
        description: string,
        price: string,
        stocks: string,
        category: 'electronics' | 'health-and-fitness' | 'furnitures' | 'accessories' | 'clothing',
        images: string[]
    }

    export interface Request {
        phone_no: number,
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
    export interface Request {
        order_no: number,
        product_id: number,
        item_quantity: number
    }


 }