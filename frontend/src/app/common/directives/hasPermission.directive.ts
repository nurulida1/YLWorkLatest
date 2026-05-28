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

// Define a strict type of allowed permission keys from your DTO
type PermissionAction =
  | 'canCreate'
  | 'canRead'
  | 'canUpdate'
  | 'canDelete'
  | 'canUpdateStatus';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  private moduleInput = signal<string>('');

  private actionInput = signal<PermissionAction>('canRead');
  private hasView = false;

  @Input('hasPermission') set module(val: string) {
    this.moduleInput.set(val);
  }

  @Input('hasPermissionAction') set action(val: PermissionAction) {
    this.actionInput.set(val);
  }

  constructor() {
    effect(() => {
      const targetModule = this.moduleInput();
      const targetAction = this.actionInput();

      const rights = this.permissionService.getModuleRights(targetModule)();

      const isAuthorized = rights && rights[targetAction] === true;

      if (isAuthorized && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!isAuthorized && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
