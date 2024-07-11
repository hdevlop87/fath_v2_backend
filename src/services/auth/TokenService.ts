import UserValidator from './UserValidator'
import { parseDuration } from '../../lib/utils'
import { msg } from '../../lib/constants';
import { tokens } from '../../db/schema';
import { eq } from "drizzle-orm";
import { db } from '../../db/index'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const userValidator = new UserValidator();

class TokenService {
    static instance = null;
    accessSecretKey: string;
    refreshSecretKey: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;

    constructor() {
        if (TokenService.instance) {
            return TokenService.instance;
        }
        this.accessSecretKey = process.env.JWT_ACCESS_SECRET;
        this.refreshSecretKey = process.env.JWT_REFRESH_SECRET;
        this.accessExpiresIn = process.env.ACCESS_EXPIRES_IN;
        this.refreshExpiresIn = process.env.REFRESH_EXPIRES_IN;
        TokenService.instance = this;
    }

    //=================== Access tokens methods ======================//

    public generateAccessToken(payload) {
        return jwt.sign(payload, this.accessSecretKey, { expiresIn: this.accessExpiresIn });
    }

    public async verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.accessSecretKey);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error(msg.ACCESS_TOKEN_EXPIRED);
            } else {
                throw new Error(msg.ACCESS_TOKEN_VERIFICATION_FAILED);
            }
        }
    }

    public async extractAccessToken(req) {
        const bearerHeader = req.headers['authorization'];
        if (bearerHeader && bearerHeader.startsWith('Bearer ')) {
            return bearerHeader.split(' ')[1];
        }
        throw new Error(msg.ACCESS_TOKEN_MISSING);
    }

    public async getUserByAccessToken(req) {
        const token = await this.extractAccessToken(req);
        const decodedToken = await this.verifyAccessToken(token);
        try {
            const userExists = await userValidator.checkUserExists(decodedToken.userId);
            return userExists;
        } catch (error) {
            throw new Error(msg.REFRESH_TOKEN_EXPIRED);
        }
    }

    //=================== Refrech tokens methods ======================//

    public generateRefreshToken(payload) {
        return jwt.sign(payload, this.refreshSecretKey, { expiresIn: this.refreshExpiresIn });
    }

    public async verifyRefreshToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.refreshSecretKey, (error, decoded) => {
                if (error) {
                    if (error instanceof jwt.TokenExpiredError) {
                        reject(new Error(msg.REFRESH_TOKEN_EXPIRED));
                    } else {
                        reject(new Error(msg.REFRESH_TOKEN_VERIFICATION_FAILED));
                    }
                    return;
                }
                resolve(decoded.userId);
            });
        });
    }

    public extractRefreshToken(req) {
        return new Promise((resolve, reject) => {
          const refreshToken = req.cookies ? req.cookies['refreshToken'] : null;
          if (!refreshToken) {
            reject(new Error(msg.REFRESH_TOKEN_EXPIRED));
          } else {
            resolve(refreshToken);
          }
        });
      }

    public async getRefreshTokenDB(userId) {
        const [token] = await db.select().from(tokens).where(eq(tokens.userId, userId));
        if (!token) {
            throw new Error(msg.REFRESH_TOKEN_EXPIRED);
        }
        
        return token?.refreshToken
    }

    public async refreshToken(req) {
        const newRefreshToken = await this.extractRefreshToken(req);
        const userId = await this.verifyRefreshToken(newRefreshToken);
        // NOTE: can i check user await userValidator.checkUserExists(userId);
        const storedRefreshToken = await this.getRefreshTokenDB(userId);

        if (newRefreshToken !== storedRefreshToken) {
            throw new Error(msg.REFRESH_TOKEN_EXPIRED);
        }
        
        const accessToken = this.generateAccessToken({ userId });
        const refreshToken = this.generateRefreshToken({ userId });
        await this.storeRefrechToken(userId, refreshToken);
        return { refreshToken, accessToken, userId };
    }

    public async revokeToken(userId) {
        await db.delete(tokens).where(eq(tokens.userId, userId)).returning();
    }

    public async storeRefrechToken(userId, refreshToken) {
        const refreshExpires = this.getRefreshTokenExpire();

        const tokenData = {
            id: uuidv4(),
            userId,
            refreshToken,
            refreshExpires
        };

        await db.insert(tokens).values(tokenData)
            .onConflictDoUpdate({
                target: tokens.userId,
                set: {
                    refreshToken: tokenData.refreshToken,
                    refreshExpires: tokenData.refreshExpires
                }
            });
    }
    //===================================================================//
    getAccessTokenExpire() {
        const currentTime = Date.now();
        const accessExpiresInMs = parseDuration(this.accessExpiresIn);
        const accessExpiresAt = new Date(currentTime + accessExpiresInMs);
        return accessExpiresAt;
    }

    getRefreshTokenExpire() {
        const currentTime = Date.now();
        const refreshExpiresInMs = parseDuration(this.refreshExpiresIn);
        const refreshExpiresAt = new Date(currentTime + refreshExpiresInMs);
        return refreshExpiresAt;
    }

    static getInstance() {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }
}

export default TokenService;

