import { Request, Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { products, users } from "../db/schema";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { MySqlRawQueryResult } from "drizzle-orm/mysql2";


interface createUserRequest extends Request{
    "firstName": string,
    "lastName": string,
    "email": string,
    "username": string,
    "password": string,
    "confPassword": string
}

export const createUser = async(req: createUserRequest , res: Response) => {
    const {firstName, lastName, email, username, password, confirmPassword} = req.body;

    const user = await db.select().from(users).where(eq(users.username, username)).limit(1)

    
    //VAlIDATE
    if (!firstName){
        return res.status(400).json({message: "First name doesn't exist"})
    }
    if (!lastName){
        return res.status(400).json({message: "Last name doesn't exist"})
    }
    if (!username){
        return res.status(400).json({message: "Username is needed"})
    }
    if (user[0]?.username === username ){
        return res.status(400).json({message: "Username already exists"})
    }
    if (!email){
        return res.status(400).json({message: "Email doesn't exist"})
    }
    if (!password){
        return res.status(400).json({message: "Password doesn't exist"})
    }
    if (!confirmPassword){
        return res.status(400).json({message: "Confirm Password doesn't exist"})
    }
    if (password !== confirmPassword){
        return res.status(400).json({message: "Password does not match"})
    }

    const salt = bcrypt.genSaltSync(10);    
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.insert(users).values({
        firstName, 
        lastName, 
        email,
        username,
        password: hashedPassword,
        role: "client",
        refreshToken:null,
        isActivated: false,
        isDeleted: false
    }).catch(error => console.log(error))
    return res.json({status: 200})
}

export const editUser = async(req: Request, res: Response) => {
    const { username, firstName, lastName, email, role} = req.body;
    const id = Number(req.params.id);
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1)
    console.log(user[0]);
    //Finding user with the id
    if(user[0] === undefined){
        return res.status(400).json({message: "No user with that id"})
    } 

    await db.update(users).set({ 
        firstName: firstName, 
        lastName: lastName, 
        email: email, 
        role: role 
    }).where(eq(users.id, user[0].id));
    
    console.log(id, user[0].id);
    
    res.status(201).json({success: true, message: "User details updated"});
}

export const deleteUser = async(req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    console.log(user[0]);

    if(!user[0]) return res.sendStatus(204);
    
    await db.update(users).set({ isDeleted: true }).where(eq(users.id, id));
    return res.sendStatus(201);
}

export const logInUser = async(req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1)
    console.log(user[0]);


    //Finding user with the username
    if(user[0] === undefined){
        return res.status(400).json({message: "No user with that username"})
    } 
    
    //Password Matching
    const isValid = await bcrypt.compare(password, user[0].password? user[0].password:"")
    if(!isValid){
        return res.status(400).json({ message: "Wrong Password" })
    }

    const payload = {
        id: user[0].id,
        user: user[0].username,
        role: user[0].role
    }
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn: "15s"});
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, {expiresIn: "1d"});

    //UPDATE THE REFRESH TOKEN COLUMN ON DATABASE
    await db.update(users).set({ refreshToken: refreshToken }).where(eq(users.id, user[0].id));
    res.cookie('refreshToken', refreshToken,{ httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.status(200).json({ 
        token: "Bearer " + accessToken, 
        role: user[0].role, 
        username: user[0].username, 
        cart: user[0].cart, 
        wishlist: user[0].wishlist 
    });
}

export const logOut = async(req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) return res.sendStatus(204);
    const user = await db.select().from(users).where(eq(users.refreshToken, refreshToken)).limit(1);
    console.log(user[0]);

    if(!user[0]) return res.sendStatus(204);
    
    await db.update(users).set({ refreshToken: null }).where(eq(users.id, user[0].id));

    res.clearCookie('refreshToken');
    console.log(user[0].username + " logged out" );

    return res.sendStatus(200);
}

 
export const refreshToken = async(req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) return res.sendStatus(401);

        const user = await db.select().from(users).where(eq(users.refreshToken, refreshToken)).limit(1);

        if(!user[0]) return res.sendStatus(403);

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, (error: any, decoded: any) => {
            if(error) return res.sendStatus(403);

            const payload = {
                id: user[0].id,
                username: user[0].username,
                role: user[0].role
            }
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string,{expiresIn: '15s'});
            res.json({ accessToken, 
                role:user[0].role,
                username: user[0].username,
                cart: user[0].cart, 
                wishlist: user[0].wishlist 
             });
        });
    } catch (error) {
        console.log(error);
    }
}


export const getAllUsers = async(req: Request, res: Response) => {
    const result = await db.select().from(users).where(
        eq(users.isDeleted, false)
    );
    return res.json(result);
}

export const getUserById = async(req: Request, res: Response) => {

    try {
        let id: number = Number(req.params.id)
        const result = await db.select({ 
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username,
            email: users.email,

         }).from(users).where(
            eq(users.id, id)
        );
        return res.json(result);

    } catch (error) {
        console.log(error + "  <---- THIS IS THE ERROR");
        return;
    }

}
export const getUserByUsername = async(req: Request, res: Response) => {
    let username: string = req.params.username

    try {
        const result = await db.select().from(users).where(
            eq(users.username, username)
        );
        return res.json(result);

    } catch (error) {
        console.log(error + "  <---- THIS IS THE ERROR");
        return;
    }

}

export const testAccessProtectedRoute = async(req: Request, res: Response) => {  
    return res.status(200).send({
        success: true,
        user: req.user
    });

}

export const getUserWishlistByUsername = async(req: Request, res: Response) => {

    try {
        let username: string = req.params.username

        const usersWishlist = await db.select({wishlist: users.wishlist}).from(users).where(
            eq(users.username, username)
        );

        try {
            const wishlist = usersWishlist[0].wishlist;
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
            console.log(error + " getUserWishlistByUsername");
            return;
        }

    } catch (error) {
        console.log(error);
        return;
    }

}

export const addUserWishlistByUsername = async(req: Request, res: Response) => {

    try {
        let username: string = req.params.username
        let productId: number = Number(req.params.productId)
        const user = await db.select({
            wishlist: users.wishlist,
            id: users.id,
            username: users.username
        }).from(users).where(
            eq(users.username, username)
        ).limit(1);

        if (!user[0]) {
            return res.status(400).json({
                success: "false",
                message: "No user with that username"
            })
        }
        console.log("wishlist: " + user[0].wishlist);

        let wishlist  = user[0].wishlist
        if (wishlist === null) {
            wishlist = [];
            wishlist.push(productId)
        } else {
            let prodID = [...wishlist].find(w => w === productId)
            if (prodID === undefined) {
                wishlist.push(productId)
            } else {
                wishlist = wishlist.filter((currVal) => {return currVal !== productId} )
                console.log(wishlist + " left");
                await db.update(users).set({ wishlist }).where(eq(users.id, user[0].id));
                return res.status(201).json({
                    success: true,
                    message: "Product is removed from wishlist"
                });
            }
        }

        await db.update(users).set({ wishlist }).where(eq(users.id, user[0].id));
        return res.status(201).json({
            success: true,
            message: "Product has been scuccesfully added to wishlist"
        });

    } catch (error) {
        console.log(error + "  <---- THIS IS THE ERROR");
        return;
    }
}

export const uploadAvatar = async(req: Request , res: Response) => {

    try {
        const uploadedFile: any = req.file;
        const { username, firstName, lastName, email } = JSON.parse(req.body.data);

        console.log(req.body.data);
        console.log(uploadedFile);
        console.log(username);
        console.log(firstName);
        console.log(lastName);
        console.log(email);

        if (uploadedFile) {
            await db.update(users).set({
                avatarImage: uploadedFile.filename,
            }).where(eq(users.username, username))
        }

        if (firstName) {
            await db.update(users).set({
                firstName: firstName,
            }).where(eq(users.username, username))
        }
        if (lastName) {
            await db.update(users).set({
                lastName: lastName,
            }).where(eq(users.username, username))
        }
        if (email) {
            await db.update(users).set({
                email: email,
            }).where(eq(users.username, username))
        }
        
        return res.status(200).json({success:true, message: "Profile Updated"})        
    } catch (error) {
        console.log(error);
    }
    
    // .json({success: true, name, description, price, stocks, category,})
}


export const addToUserCart = async(req: createUserRequest , res: Response) => {
    const username = req.params.username;
    const { cart } = req.body;

    const user = await db.select().from(users).where(eq(users.username, username)).limit(1)

    if(!user[0]){
        return res.status(400).json({message: "Username doesn't exist"})
    }

    await db.update(users).set({
        cart:cart, 
    })
    .where(eq(users.username, username))
    .catch(error => console.log(error))

    return res.status(200).json({message: "Success"})

}