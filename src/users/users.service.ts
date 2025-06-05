import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { PasswordService } from '../common/password.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private passwordService: PasswordService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    if (!userData.password) {
      throw new Error('Senha é obrigatória');
    }
    // Verifica se o e-mail já existe
    const existing = await this.usersRepository.findOne({ where: { email: userData.email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const hashedPassword = await this.passwordService.hashPassword(userData.password);
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findAll(user?: User): Promise<User[]> {
    if (user?.role === UserRole.ADMIN) {
      return this.usersRepository.find();
    } else if (user?.role === UserRole.MANAGER) {
      return this.usersRepository.find({
        where: { role: UserRole.USER }
      });
    } else {
      // Usuário comum só pode ver seu próprio perfil
      return this.usersRepository.find({
        where: { id: user?.id }
      });
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    
    if (userData.password) {
      userData.password = await this.passwordService.hashPassword(userData.password);
    }

    Object.assign(user, userData);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async count(): Promise<number> {
    return this.usersRepository.count();
  }
}
