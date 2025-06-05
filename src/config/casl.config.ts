import { AbilityBuilder, PureAbility, createMongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subject = 'User' | 'Role' | 'Permission' | 'all';

export type AppAbility = PureAbility<[Action, Subject]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: any) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);


    if (user.role === 'admin') {
      can('manage', 'all');
    } else {
      can('read', 'User');
      can('update', 'User', { id: user.id });
    }

    return build();
  }
} 