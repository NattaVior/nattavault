import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-secret-change-me');
export async function createSession(userId:string){return new SignJWT({userId}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret)}
export async function getSession(){const token=cookies().get('nv_session')?.value;if(!token)return null;try{return (await jwtVerify(token,secret)).payload as {userId:string}}catch{return null}}
export async function requireUser(){const session=await getSession();if(!session?.userId) throw new Error('Unauthorized');return session.userId}
