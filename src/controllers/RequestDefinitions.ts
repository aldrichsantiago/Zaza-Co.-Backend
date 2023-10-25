import { Request } from "express"
import { z } from "zod";

// USER SCHEMA
export interface createUserRequest extends Request {
  "firstName": string,
  "lastName": string,
  "email": string,
  "username": string,
  "password": string,
  "confPassword": string
}