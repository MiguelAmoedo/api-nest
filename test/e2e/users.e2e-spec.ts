import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { User, UserRole } from '../../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { PasswordService } from '../../src/common/password.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let authService: AuthService;
  let adminToken: string;
  let managerToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    usersRepository = moduleFixture.get(getRepositoryToken(User));
    authService = moduleFixture.get(AuthService);


    await usersRepository.clear();

    const passwordService = new PasswordService();
    const hashedPassword = await passwordService.hashPassword('123456');


    const admin = await usersRepository.save({
      name: 'Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });


    const manager = await usersRepository.save({
      name: 'Manager',
      email: 'manager@test.com',
      password: hashedPassword,
      role: UserRole.MANAGER,
    });

  
    const user = await usersRepository.save({
      name: 'User',
      email: 'user@test.com',
      password: hashedPassword,
      role: UserRole.USER,
    });


    const adminLogin = await authService.login(admin);
    const managerLogin = await authService.login(manager);
    const userLogin = await authService.login(user);

    adminToken = adminLogin.access_token;
    managerToken = managerLogin.access_token;
    userToken = userLogin.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cenário 1: Usuário não autenticado', () => {
    it('deve receber 401 ao tentar listar usuários', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('Cenário 2: Usuário comum', () => {
    it('deve receber 403 ao tentar listar todos os usuários', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('deve conseguir ver seu próprio perfil', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].email).toBe('user@test.com');
    });
  });

  describe('Cenário 3: Usuário gerente', () => {
    it('deve receber 403 ao tentar alterar role de um usuário', async () => {
      const user = await usersRepository.findOne({ where: { email: 'user@test.com' } });
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ role: UserRole.ADMIN })
        .expect(403);
    });

    it('deve conseguir listar todos os usuários', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });
  });

  describe('Cenário 4: Administrador', () => {
    it('deve conseguir editar um usuário com sucesso', async () => {
      const user = await usersRepository.findOne({ where: { email: 'user@test.com' } });
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Novo Nome' })
        .expect(200);

      expect(response.body.name).toBe('Novo Nome');
    });
  });

  describe('Cenário 5: Validação de email', () => {
    it('deve receber 400 ao tentar cadastrar com email existente', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'admin@test.com', // Email já existente
          password: '123456',
          role: UserRole.USER,
        })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Email already in use');
        });
    });
  });
}); 