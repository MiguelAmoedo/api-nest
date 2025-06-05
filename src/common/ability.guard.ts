import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityService, Action, Subjects } from './ability.service';
import { AppAbility } from './ability.service';

interface RequiredRule {
  action: Action;
  subject: Subjects;
}

@Injectable()
export class AbilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityService: AbilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules = this.reflector.get<RequiredRule[]>('abilities', context.getHandler());
    if (!rules) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const ability = this.abilityService.createForUser(user);

    return rules.every((rule) => ability.can(rule.action, rule.subject));
  }
} 