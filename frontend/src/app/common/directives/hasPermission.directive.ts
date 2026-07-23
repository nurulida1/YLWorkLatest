import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
  signal,
} from '@angular/core';
import { PermissionService } from '../../services/permissionService';
import { PermissionContextService } from '../../services/permission-context.service';
import { PermissionAction } from '../permission/permission.types';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);
  private permissionContext = inject(PermissionContextService);

  private moduleInput = signal<string>('');
  private actionInput = signal<PermissionAction>('canRead');
  private hasView = false;

  /** Optional module override; when omitted, uses PermissionContext from the active route. */
  @Input('hasPermission') set module(val: string) {
    this.moduleInput.set(val ?? '');
  }

  @Input('hasPermissionAction') set action(val: PermissionAction) {
    this.actionInput.set(val);
  }

  constructor() {
    effect(() => {
      const targetModule =
        this.moduleInput() || this.permissionContext.moduleKey() || '';
      const targetAction = this.actionInput();

      if (!targetModule) {
        this.clearView();
        return;
      }

      const rights = this.permissionService.getModuleRights(targetModule)();
      const isAuthorized = rights?.[targetAction] === true;

      if (isAuthorized && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!isAuthorized && this.hasView) {
        this.clearView();
      }
    });
  }

  private clearView() {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/** Shorthand: only declare the action; module comes from route PermissionContext. */
@Directive({
  selector: '[hasPermissionAction]',
  standalone: true,
})
export class HasPermissionActionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);
  private permissionContext = inject(PermissionContextService);

  private actionInput = signal<PermissionAction>('canRead');
  private hasView = false;

  @Input('hasPermissionAction') set action(val: PermissionAction) {
    this.actionInput.set(val);
  }

  constructor() {
    effect(() => {
      const targetModule = this.permissionContext.moduleKey() || '';
      const targetAction = this.actionInput();

      if (!targetModule) {
        this.clearView();
        return;
      }

      const rights = this.permissionService.getModuleRights(targetModule)();
      const isAuthorized = rights?.[targetAction] === true;

      if (isAuthorized && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!isAuthorized && this.hasView) {
        this.clearView();
      }
    });
  }

  private clearView() {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
