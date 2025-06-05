import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { PasswordService } from '../common/password.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let passwordService: PasswordService;

  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockPasswordService = {
    comparePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('deve retornar o usuário quando as credenciais são válidas', async () => {
      const email = 'test@example.com';
      const password = '123456';

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toMatchObject({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).not.toHaveProperty('password');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.comparePassword).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('deve lançar UnauthorizedException quando o usuário não é encontrado', async () => {
      const email = 'nonexistent@example.com';
      const password = '123456';

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.comparePassword).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando a senha é inválida', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.comparePassword.mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.comparePassword).toHaveBeenCalledWith(password, mockUser.password);
    });
  });

  describe('login', () => {
    it('deve retornar um token JWT quando o login é bem-sucedido', async () => {
      const token = 'jwt-token';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(mockUser);

      expect(result).toEqual({
        access_token: token,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });
});
