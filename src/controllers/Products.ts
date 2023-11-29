import { Request, Response } from "express";
import { and, asc, desc, eq, name, sql } from "drizzle-orm";
import { db } from "../db";
import { products } from "../db/schema";
import multer from 'multer'
import { MySqlRawQueryResult } from "drizzle-orm/mysql2";


interface createProductRequest extends Request{
    name: string,
    description: string,
    price: string,
    stocks: string,
    category: 'electronics' | 'health-and-fitness' | 'furnitures' | 'accessories' | 'clothing',
    images: string[]
}


function removeWhitespace(str: string) {
    return str?.split(' ').filter(Boolean).join('');
  }

// Define storage configuration for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'src/uploads/'); // Set the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {  
      cb(null, Date.now() + '.' + removeWhitespace(file.originalname)); // Rename the file to prevent conflicts
    },
  });


export const upload = multer({ storage: storage });



export const uploadProductPhotos = async(req: createProductRequest , res: Response) => {
    const {firstName, lastName, email, username, password, confirmPassword} = req.body;
    
    console.log(req.body)
    if (!req.files) {
        return res.status(400).send('No file uploaded.');
      }
    
    res.status(200);
}

export const createProduct = async(req: Request , res: Response) => {
    try {
        const body = JSON.parse(JSON.stringify(req.body));
        const { name, description, price, stocks, category } = JSON.parse(body.data);
        console.log(body.data);
        
        const uploadedFiles:any = req.files

        let images = []
        for (const file of [...uploadedFiles]){
            images.push(file.filename)
            console.log(file.filename)
        }
        console.log(images)
        if (!req.files) {
            console.log(req.files)
            return res.status(400).json({success: false, message:'No file uploaded.'});
        }
        console.log(req.body)
        console.log(req.files)

        await db.insert(products).values({
            name, 
            description, 
            price: price,
            stocks: stocks,
            category,
            quantitySold: 0,
            ratings: 0,
            images,
            isDeleted: false,
        }).catch((error) => console.log(error))

        // return res.redirect('/admin/products');
        return res.status(200).redirect('/admin/products');
    } catch (error) {
        console.log(error);
    }
    
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

export const editProductImages = async(req: Request, res: Response) => {
    try {
        const id  = Number(req.params.id)
        const { images } = JSON.parse(req.body.data);
        
        const uploadedFiles:any = req.files
        const newImageArr: any[] = [...images]


        console.log(req.files);

        for (const file of [...uploadedFiles]){
            newImageArr.push(file.filename)
            console.log(file.filename)
        }

        if (images.length > 3) {
            return res.status(400).json({message:'Product Images cannot be more than three.'});
        }
        if (newImageArr.length > 3) {
            return res.status(400).json({message:'Product Images cannot be more than three.'});
        }
        if (!req.files) {
            console.log(req.files)
            return res.status(400).json({message:'No file uploaded.'});
        }
        console.log(newImageArr);
        

        const product = await db.select().from(products).where(eq(products.id, id)).limit(1);

        if(!product[0]) return res.sendStatus(204);

        await db.update(products).set({ 
            images: newImageArr
        }).where(eq(products.id, product[0].id));

        return res.status(201).json({success: true, message: "Product Images updated"});
        
    } catch (error) {
        console.log(error);
        return res.status(300).json({success: false, message: "Updating Product Images Error"});
    } 
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


export const getAllProducts = async(req: Request, res: Response) => {
    const result = await db.select().from(products).where(
        eq(products.isDeleted, false)
    );
    return res.json(result);
}

export const getProductById = async(req: Request, res: Response) => {

    try {
        let id: number = Number(req.params.id)
        const result = await db.select().from(products).where(
            and(
            eq(products.id, id),
            eq(products.isDeleted, false)
            )
        ).limit(1);
        return res.json(result);

    } catch (error) {
        console.log(error + "  <---- THIS IS THE ERROR");
        return;
    }
}

export const getProductSearchSuggestions = async(req: Request, res: Response) => {

    try {
        let nameQuery = req.query.search?.toString()
        console.log(nameQuery);

        
        const queryStatement = sql.raw(`SELECT * FROM products WHERE products.name LIKE '%${nameQuery}%' AND products.is_deleted = '0' limit 4`);
        const result: MySqlRawQueryResult = await db.execute(queryStatement);
        return res.json(result);

    } catch (error) {
        console.log(error + " getProductSearchSuggestionsError");
        return;
    }

}
export const getProductSearch = async(req: Request, res: Response) => {

    try {
        let nameQuery = req.query.search?.toString()
        console.log(nameQuery);

        
        const queryStatement = sql.raw(`select * from products where products.name LIKE '%${nameQuery}%'`);
        const result: MySqlRawQueryResult = await db.execute(queryStatement);
        return res.json(result);

    } catch (error) {
        console.log(error + " getProductSearchSuggestionsError");
        return;
    }

}

export const getWishlistProducts = async(req: Request, res: Response) => {

    try {
        const { wishlist } = req.body;
        console.log(wishlist);
        if (!wishlist) {
            return res.status(400).json({success: false, message: "There are no wishlist"})
        }
        const finalSql = sql`select * from products`;
        
        finalSql.append(sql` where `);
  
        for (let i = 0; i < wishlist.length; i++) {
            finalSql.append(sql`id = ${wishlist[i]}`);
        
            if (i === wishlist.length-1) continue;
            finalSql.append(sql` or `);
        }

        const result: MySqlRawQueryResult = await db.execute(finalSql);
        return res.json(result);

    } catch (error) {
        console.log(error + " getWishlistProductsByUsername");
        return;
    }
}


export const getFeauturedProducts = async(req: Request, res: Response) => {
    try {
        const result = await db.select().from(products).where(eq(products.isDeleted, false)).orderBy(desc(products.quantitySold)).limit(16);
        return res.status(200).json(result);

    } catch (error) {

        console.log(error);
        return res.status(400).json({ message: "There was a server error" });

    }
}

export const getNewProducts = async(req: Request, res: Response) => {
    try {
        const result = await db.select().from(products).where(eq(products.isDeleted, false)).orderBy(desc(products.createdAt));
        return res.status(200).json(result);

    } catch (error) {

        console.log(error);
        return res.status(400).json({ message: "There was a server error" });

    }
}

export const getDealsProducts = async(req: Request, res: Response) => {
    try {
        const result = await db.select().from(products).where(eq(products.isDeleted, false)).orderBy(asc(products.price));
        return res.status(200).json(result);

    } catch (error) {

        console.log(error);
        return res.status(400).json({ message: "There was a server error" });

    }
}