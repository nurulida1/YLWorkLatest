import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Sidemenu } from '../sidemenu/sidemenu';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-web-layout',
  imports: [CommonModule, NavbarComponent, Sidemenu, RouterOutlet],
  template: `<div class="h-screen w-full flex flex-row">
    <div class="lg:w-[20%] 2xl:w-[18%] overflow-y-auto bg-gray-800">
      <app-sidemenu class="h-full w-0 lg:w-full"></app-sidemenu>
    </div>

    <div
      class="flex flex-col w-full lg:w-[80%] 2xl:w-[82%] bg-gray-50 overflow-y-auto"
    >
      <app-navbar></app-navbar>

      <router-outlet></router-outlet>
    </div>
  </div> `,
  styleUrl: './web-layout.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebLayout {}
