import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository, UserRepository } from '../repositories/user.repository';
import {
  UserRow,
  UserDTO,
  LoginInput,
  RegisterInput,
  AuthResponse,
  AuthTokenPayload,
} from '../types/auth.types';
import { ServiceError } from './production.service';

export class AuthService {
  constructor(private repo: UserRepository = userRepository) {}

  private getJwtSecret(): string {
    return process.env.JWT_SECRET || 'autotrack_default_jwt_secret_key_32_chars';
  }

  private getJwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '24h';
  }

  private sanitizeUser(row: UserRow): UserDTO {
    return {
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      role: row.role,
      first_name: row.first_name,
      last_name: row.last_name,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
    };
  }

  private generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: this.getJwtExpiresIn() as any,
    });
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.repo.findByEmail(input.email);
    if (!user || !user.is_active) {
      throw new ServiceError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isValid) {
      throw new ServiceError('Invalid email or password', 401);
    }

    const token = this.generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingEmail = await this.repo.findByEmail(input.email);
    if (existingEmail) {
      throw new ServiceError('A user with this email address already exists', 409);
    }

    const existingUsername = await this.repo.findByUsername(input.username);
    if (existingUsername) {
      throw new ServiceError('A user with this username already exists', 409);
    }

    const safeRole = input.role === 'ADMIN' ? 'VIEWER' : (input.role || 'VIEWER');
    const password_hash = await bcrypt.hash(input.password, 10);
    const userId = await this.repo.create({
      ...input,
      role: safeRole,
      password_hash,
    });

    const newUser = await this.repo.findById(userId);
    if (!newUser) {
      throw new ServiceError('Failed to retrieve newly registered user', 500);
    }

    const token = this.generateToken({
      userId: newUser.user_id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  async getCurrentUser(userId: number): Promise<UserDTO> {
    const user = await this.repo.findById(userId);
    if (!user || !user.is_active) {
      throw new ServiceError('User session expired or user not found', 401);
    }
    return this.sanitizeUser(user);
  }
}

export const authService = new AuthService();
