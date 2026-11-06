import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-get-started',
  imports: [CommonModule, RouterLink, ButtonModule],
  template: `<div
    class="get-started-page h-screen flex flex-col items-center justify-between pt-3 relative overflow-hidden bg-[#1E3C92]"
  >
    <!-- Background Decorations -->
    <div
      class="bg-circle bg-circle-1 absolute -top-12 -right-16 w-64 h-64 bg-[#ffffff0d] rounded-full blur-md"
    ></div>

    <div
      class="bg-circle bg-circle-2 absolute top-48 -left-12 w-48 h-48 bg-[#60a5fa1a] rounded-full blur"
    ></div>

    <!-- Header -->
    <div
      class="get-started-header w-[90%] px-6 h-[10%] flex flex-col gap-4 items-center relative mt-4"
    >
      <div
        class="platform-badge flex flex-row items-center gap-2 w-fit border shadow-md border-white/20 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-2xl text-white/80 text-[10px] tracking-[0.5px] leading-[15px] font-semibold"
      >
        <i class="pi pi-circle-fill text-blue-300! text-[5px]!"></i>
        <span>YL WORKS PLATFORM</span>
      </div>

      <div
        class="main-heading font-medium text-white text-2xl text-shadow-2xs tracking-wide text-center"
      >
        Manage your workday in one simple place
      </div>

      <span
        class="main-description font-light text-[#dbeafecc] text-sm text-center tracking-wide"
      >
        Streamline tasks, schedule meetings, and collaborate across teams
        effortlessly.
      </span>
    </div>

    <!-- Task Board -->
    <div
      class="task-board-wrapper px-6 h-[40%] flex flex-col relative mt-25 items-center justify-center w-[80%]"
    >
      <div
        class="task-board px-4 py-7 bg-white/10 rounded-xl border border-white/30 flex flex-col w-full self-stretch relative backdrop-blur-2xl backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(6px)_brightness(100%)]"
      >
        <div
          class="flex flex-row items-center justify-between border-b border-white/10 pb-2 mb-4"
        >
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-circle-fill text-blue-300 text-[8px]!"></i>
            <i class="pi pi-circle-fill text-white/40 text-[8px]!"></i>
            <i class="pi pi-circle-fill text-white/40 text-[8px]!"></i>
          </div>

          <div class="tracking-wide text-white/70 text-sm ml-2">TASK BOARD</div>
        </div>

        <div class="flex flex-row items-center justify-between pb-2">
          <div class="text-white/70 text-sm">Sprint Deliverables</div>
          <div class="text-white/70 text-sm font-semibold">84%</div>
        </div>

        <div
          class="relative self-stretch w-full h-2 bg-[#ffffff33] rounded-full overflow-hidden"
        >
          <div class="progress-bar w-[84%] h-full bg-white rounded-full"></div>
        </div>

        <div class="grid grid-cols-12 gap-3 justify-between mt-4">
          <div
            class="stat-card px-4 py-2 bg-[#1E3C92]/10 rounded-lg col-span-4 flex flex-col gap-4 items-center justify-center text-center backdrop-blur-2xl"
          >
            <div class="text-white/70 text-sm font-light">Tasks</div>
            <div class="text-white/70 text-sm font-semibold">24</div>
          </div>

          <div
            class="stat-card px-4 py-2 bg-[#1E3C92]/10 rounded-lg col-span-4 flex flex-col gap-4 items-center justify-center text-center backdrop-blur-2xl"
          >
            <div class="text-white/70 text-sm font-light">Review</div>
            <div class="text-white/70 text-sm font-semibold">6</div>
          </div>

          <div
            class="stat-card px-4 py-2 bg-white/10 border border-white/30 rounded-lg col-span-4 flex flex-col gap-4 items-center justify-center text-center backdrop-blur-2xl"
          >
            <div class="text-white/70 text-sm font-light">Done</div>
            <div class="text-white/70 text-sm font-semibold">18</div>
          </div>
        </div>

        <!-- Team Active -->
        <div
          class="team-active shadow-md absolute top-2 -right-15 bg-white p-3 rounded-xl flex flex-row items-center gap-2"
        >
          <i class="pi pi-circle-fill text-green-500 text-xs! mt-1!"></i>

          <span class="text-sm font-medium text-gray-700"> Team Active </span>
        </div>

        <!-- Project Approval -->
        <div
          class="project-approval shadow-2xl absolute -bottom-13 -left-12 bg-white p-4 rounded-2xl flex flex-row items-center gap-3"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center bg-[#2563EB]"
          >
            <i class="pi pi-verified text-white"></i>
          </div>

          <div class="flex flex-col">
            <span class="font-medium">Project Approval</span>
            <span class="text-xs font-light text-gray-500">
              Completed today
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Content -->
    <div class="bottom-section mt-7 h-[50%] w-full flex items-end justify-end">
      <div
        class="bg-white py-5 px-7 w-full rounded-t-3xl flex flex-col items-center justify-center"
      >
        <div class="handle mt-4 w-15 h-[4px] bg-gray-200 rounded-full"></div>

        <div class="bottom-title text-[#1839a6] font-extrabold mt-10 text-4xl">
          YL WORKS
        </div>

        <div class="bottom-subtitle font-semibold mt-2 text-xl">
          Let's Get You Set Up for Success
        </div>

        <span
          class="bottom-description w-[90%] font-light text-gray-500 mt-2 text-center"
        >
          Organize your workflow, submit material requets, and track daily tasks
          in one unified interface.
        </span>

        <p-button
          label="Get Started"
          [rounded]="true"
          [severity]="'info'"
          styleClass="w-full! shadow-lg! p-4! tracking-wide! text-lg! bg-[#1E4FD8]! text-white! border-none! hover:bg-[#1E4FD8]!"
          class="get-started-button mt-7 w-full!"
          [routerLink]="'/register'"
        ></p-button>

        <div class="sign-in py-4 text-gray-500">
          Already have an account?

          <b
            class="text-[#1E4FD8] hover:underline cursor-pointer"
            [routerLink]="'/login'"
          >
            Sign In
          </b>
        </div>

        <div
          class="bottom-handle mt-4 w-50 h-[5px] bg-gray-300 rounded-full"
        ></div>
      </div>
    </div>
  </div>`,
  styleUrl: './get-started.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetStarted {}
