import passport from "passport";
import passportJWT from "passport-jwt";
import { users } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;


const opts = {
    jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey : process.env.ACCESS_TOKEN_SECRET as string
}

passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    console.log(jwt_payload)
    const user = await db.select({id: users.id, username: users.username}).from(users).where(eq(users.id, jwt_payload.id)).limit(1)
        .then((user) => {
            console.log(user);
            return done(null, user);
        })
        .catch((error) => {
            console.log(error);
            return done(error, false);
        }).finally(() => {
            console.log("Promise Completed");
        })

}));