import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PureAbility, createMongoAbility, ExtractSubjectType, InferSubjects, MongoAbility } from '@casl/ability';
import { User, UserRole } from '../entities/user.entity';

export enum Action {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Manage = 'manage',
}
export type Subjects = InferSubjects<typeof User> | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class AbilityService {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === UserRole.ADMIN) {
      can(Action.Manage, 'all'); // Admin pode fazer tudo
    } else if (user.role === UserRole.MANAGER) {
      can(Action.Read, 'all'); // Gerente pode ler tudo
      can(Action.Update, User, { role: { $ne: UserRole.ADMIN } }); // Mas não pode alterar admins
      cannot(Action.Update, User, ['role']); // Não pode alterar roles
    } else {
      // Usuário comum
      can(Action.Read, User, { id: user.id }); // Pode ler apenas seu próprio perfil
      can(Action.Update, User, { id: user.id }); // Pode atualizar apenas seu próprio perfil
      cannot(Action.Update, User, ['role']); // Não pode alterar roles
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
} 