import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Sidemenu } from '../sidemenu/sidemenu';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-web-layout',
  imports: [CommonModule, NavbarComponent, Sidemenu, RouterOutlet],
  template: `<div class="h-screen w-full flex flex-row">
    <!-- SIDEMENU -->

    <div class="lg:w-[20%] 2xl:w-[15%] overflow-y-auto">
      <app-sidemenu class="h-full w-0 lg:w-full"></app-sidemenu>
    </div>

    <!-- MAIN CONTENT -->
    <div
      class="flex flex-col w-full lg:w-[80%] 2xl:w-[85%] bg-[#F9FAFB] overflow-y-auto"
    >
      <app-navbar></app-navbar>

      <router-outlet></router-outlet>
    </div>
  </div> `,
  styleUrl: './web-layout.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebLayout {}
