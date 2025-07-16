import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface JwtPayload {
  userId: string
  email: string
  isDriver?: boolean
  driverStatus?: string
}

export const generateAccessToken = (payload: JwtPayload): string => {
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.expiresIn,
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

export const generateRefreshToken = (payload: JwtPayload): string => {
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn,
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
}

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload
}

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch {
    return null
  }
}