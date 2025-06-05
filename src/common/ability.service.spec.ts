import { Test, TestingModule } from '@nestjs/testing';
import { AbilityService } from './ability.service';
import { User, UserRole } from '../entities/user.entity';
import { Action } from './ability.service';

describe('AbilityService', () => {
  let service: AbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityService],
    }).compile();

    service = module.get<AbilityService>(AbilityService);
  });

  describe('createForUser', () => {
    it('deve definir permissões de administrador corretamente', () => {
      const admin: User = {
        id: '1',
        name: 'Admin',
        email: 'admin@example.com',
        password: 'hashedPassword',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ability = service.createForUser(admin);

      // Admin pode gerenciar todos os usuários
      expect(ability.can(Action.Manage, 'all')).toBe(true);
      expect(ability.can(Action.Create, User)).toBe(true);
      expect(ability.can(Action.Read, User)).toBe(true);
      expect(ability.can(Action.Update, User)).toBe(true);
      expect(ability.can(Action.Delete, User)).toBe(true);
    });

    it('deve definir permissões de gerente corretamente', () => {
      const manager: User = {
        id: '2',
        name: 'Manager',
        email: 'manager@example.com',
        password: 'hashedPassword',
        role: UserRole.MANAGER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ability = service.createForUser(manager);

      // Gerente pode ler todos os usuários
      expect(ability.can(Action.Read, 'all')).toBe(true);
      // Gerente não pode alterar roles
      expect(ability.cannot(Action.Update, User, 'role')).toBe(true);
      // Gerente não pode excluir usuários
      expect(ability.cannot(Action.Delete, User)).toBe(true);
    });

    it('deve definir permissões de usuário comum corretamente', () => {
      const user: User = {
        id: '3',
        name: 'User',
        email: 'user@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ability = service.createForUser(user);

      // Usuário comum pode ler e atualizar seu próprio perfil
      expect(ability.can(Action.Read, { ...user } as any)).toBe(true);
      expect(ability.can(Action.Update, { ...user } as any)).toBe(true);
      // Usuário comum não pode alterar sua role
      expect(ability.cannot(Action.Update, User, 'role')).toBe(true);
      // Usuário comum não pode ver outros usuários
      expect(ability.cannot(Action.Read, { id: '4' } as any)).toBe(true);
      // Usuário comum não pode excluir usuários
      expect(ability.cannot(Action.Delete, User)).toBe(true);
    });
  });
}); 