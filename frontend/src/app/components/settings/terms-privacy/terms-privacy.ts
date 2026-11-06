import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-terms-privacy',
  imports: [CommonModule, RouterLink, TranslatePipe, TranslateDirective],
  template: `
    <div class="min-h-screen bg-slate-50 pb-8">
      <!-- Header -->
      <div class="bg-white border-b border-slate-200 px-5 pt-5 pb-5">
        <div class="flex items-center gap-3">
          <a
            routerLink="/mobile-settings"
            class="w-10 h-10 rounded-xl bg-slate-100 flex items-center
                   justify-center active:bg-slate-200 transition-colors"
            aria-label="Back to settings"
          >
            <i class="pi pi-arrow-left text-slate-700"></i>
          </a>

          <div class="min-w-0">
            <h1 class="text-xl font-bold text-slate-900" translate>
              Terms & Privacy
            </h1>
            <p class="text-xs text-slate-500 mt-1" translate>
              OfficeHub policies and information
            </p>
          </div>
        </div>
      </div>

      <div class="px-5 pt-5 space-y-5">
        <!-- Introduction -->
        <div
          class="relative overflow-hidden rounded-2xl
                    bg-gradient-to-br from-blue-600 to-indigo-700
                    p-5 text-white shadow-lg shadow-blue-200/40"
        >
          <div
            class="absolute -right-8 -top-10 w-36 h-36
                      rounded-full bg-white/10"
          ></div>

          <div
            class="absolute -right-5 -bottom-16 w-40 h-40
                      rounded-full bg-white/10"
          ></div>

          <div class="relative">
            <div
              class="w-12 h-12 rounded-xl bg-white/15
                        flex items-center justify-center mb-4"
            >
              <i class="pi pi-shield text-2xl text-white"></i>
            </div>

            <h2 class="text-lg font-bold" translate>
              Your information matters
            </h2>

            <p class="text-sm text-blue-100 leading-relaxed mt-2">
              OfficeHub provides a central platform for managing workplace
              information and activities. This page explains the terms of using
              the platform and how information should be handled.
            </p>

            <div
              class="mt-4 inline-flex items-center gap-2
                        rounded-full bg-white/15 px-3 py-1.5"
            >
              <i class="pi pi-file-check text-xs"></i>
              <span class="text-xs font-medium">
                OfficeHub · Terms & Privacy
              </span>
            </div>
          </div>
        </div>

        <!-- Policy notice -->
        <div
          class="flex gap-3 rounded-xl border border-amber-200
                    bg-amber-50 p-4"
        >
          <i class="pi pi-info-circle text-amber-600 mt-0.5"></i>
          <div>
            <p class="text-sm font-semibold text-amber-900">
              Policy information
            </p>
            <p class="text-xs leading-relaxed text-amber-800 mt-1">
              This is a policy template for OfficeHub. The company should review
              and approve the content before it is treated as its official legal
              policy.
            </p>
          </div>
        </div>

        <!-- Document information -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <i class="pi pi-file text-blue-600 text-lg"></i>
            <p class="text-xs text-slate-500 mt-3">Document</p>
            <p class="text-sm font-semibold text-slate-800 mt-1">
              Terms of Use
            </p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <i class="pi pi-lock text-emerald-600 text-lg"></i>
            <p class="text-xs text-slate-500 mt-3">Document</p>
            <p class="text-sm font-semibold text-slate-800 mt-1">
              Privacy Policy
            </p>
          </div>
        </div>

        <!-- Terms of Use -->
        <section class="space-y-3">
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider
                      text-blue-600"
            >
              Part 01
            </p>
            <h2 class="text-lg font-bold text-slate-900 mt-1" translate>
              Terms of Use
            </h2>
            <p class="text-xs text-slate-500 mt-1">
              Rules and responsibilities when using OfficeHub.
            </p>
          </div>

          @for (section of termsSections; track section.id) {
            <div
              class="rounded-2xl border border-slate-200
                        bg-white overflow-hidden shadow-sm"
            >
              <button
                type="button"
                class="w-full flex items-center gap-3 p-4 text-left
                       active:bg-slate-50 transition-colors"
                (click)="toggleSection(section.id)"
                [attr.aria-expanded]="expandedSections()[section.id]"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-blue-50
                            flex items-center justify-center shrink-0"
                >
                  <i [class]="section.icon + ' text-blue-600'"></i>
                </div>

                <span class="flex-1 min-w-0">
                  <span
                    class="block text-sm font-semibold
                               text-slate-800"
                  >
                    {{ section.title }}
                  </span>
                  <span class="block text-xs text-slate-500 mt-1">
                    {{ section.subtitle }}
                  </span>
                </span>

                <i
                  class="pi text-xs text-slate-400"
                  [ngClass]="
                    expandedSections()[section.id]
                      ? 'pi-chevron-up'
                      : 'pi-chevron-down'
                  "
                ></i>
              </button>

              @if (expandedSections()[section.id]) {
                <div class="px-4 pb-4 pt-1 border-t border-slate-100">
                  <ul class="space-y-3 pt-3">
                    @for (item of section.items; track $index) {
                      <li
                        class="flex gap-2.5 text-sm
                                 leading-relaxed text-slate-600"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full
                                     bg-blue-500 shrink-0 mt-2"
                        ></span>
                        <span>{{ item }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </section>

        <!-- Privacy Policy -->
        <section class="space-y-3">
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider
                      text-emerald-600"
            >
              Part 02
            </p>
            <h2 class="text-lg font-bold text-slate-900 mt-1" translate>
              Privacy Policy
            </h2>
            <p class="text-xs text-slate-500 mt-1">
              How employee and company information is handled.
            </p>
          </div>

          @for (section of privacySections; track section.id) {
            <div
              class="rounded-2xl border border-slate-200
                        bg-white overflow-hidden shadow-sm"
            >
              <button
                type="button"
                class="w-full flex items-center gap-3 p-4 text-left
                       active:bg-slate-50 transition-colors"
                (click)="toggleSection(section.id)"
                [attr.aria-expanded]="expandedSections()[section.id]"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-emerald-50
                            flex items-center justify-center shrink-0"
                >
                  <i [class]="section.icon + ' text-emerald-600'"></i>
                </div>

                <span class="flex-1 min-w-0">
                  <span
                    class="block text-sm font-semibold
                               text-slate-800"
                  >
                    {{ section.title }}
                  </span>
                  <span class="block text-xs text-slate-500 mt-1">
                    {{ section.subtitle }}
                  </span>
                </span>

                <i
                  class="pi text-xs text-slate-400"
                  [ngClass]="
                    expandedSections()[section.id]
                      ? 'pi-chevron-up'
                      : 'pi-chevron-down'
                  "
                ></i>
              </button>

              @if (expandedSections()[section.id]) {
                <div class="px-4 pb-4 pt-1 border-t border-slate-100">
                  <ul class="space-y-3 pt-3">
                    @for (item of section.items; track $index) {
                      <li
                        class="flex gap-2.5 text-sm
                                 leading-relaxed text-slate-600"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full
                                     bg-emerald-500 shrink-0 mt-2"
                        ></span>
                        <span>{{ item }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </section>

        <!-- Employee Responsibilities -->
        <div
          class="rounded-2xl border border-slate-200
                    bg-white p-5 shadow-sm"
        >
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-10 h-10 rounded-xl bg-amber-50
                        flex items-center justify-center"
            >
              <i class="pi pi-user text-amber-600 text-lg"></i>
            </div>
            <h3 class="font-bold text-slate-900">Employee Responsibilities</h3>
          </div>

          <p class="text-sm text-slate-600 leading-relaxed">
            Every employee is responsible for protecting their login
            credentials, using OfficeHub appropriately and handling company and
            colleague information responsibly. Report suspected unauthorised
            access or security incidents to the designated company
            administrator.
          </p>
        </div>

        <!-- Contact -->
        <div class="rounded-2xl bg-slate-900 p-5 text-white">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-white/10
                        flex items-center justify-center"
            >
              <i class="pi pi-envelope text-lg"></i>
            </div>
            <div>
              <h3 class="font-bold text-sm">Questions about these policies?</h3>
              <p class="text-xs text-slate-300 mt-1">
                Contact your HR department or system administrator.
              </p>
            </div>
          </div>

          <div class="h-px bg-white/10 my-4"></div>

          <p class="text-xs text-slate-400 leading-relaxed">
            For questions about personal information, access, corrections or
            privacy concerns, contact the designated person responsible for data
            protection within your organisation.
          </p>
        </div>

        <!-- Footer -->
        <div class="text-center pt-2 pb-5">
          <div class="flex items-center justify-center gap-2">
            <i class="pi pi-shield text-slate-400 text-sm"></i>
            <span class="text-sm font-bold text-slate-500"> OfficeHub </span>
          </div>
          <p class="text-xs text-slate-400 mt-2">Terms & Privacy</p>
          <p class="text-[11px] text-slate-400 mt-1">
            Policy effective date: To be confirmed
          </p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPrivacy {
  readonly expandedSections = signal<Record<string, boolean>>({
    'terms-access': true,
    'privacy-collection': true,
  });

  toggleSection(id: string): void {
    this.expandedSections.update((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  readonly termsSections = [
    {
      id: 'terms-access',
      title: '1. Account Access',
      subtitle: 'Your account and login responsibilities',
      icon: 'pi pi-user',
      items: [
        'OfficeHub accounts are intended for authorised employees and users approved by the organisation.',
        'Users must keep their passwords and authentication details confidential.',
        'Users must not share accounts or allow another person to access their account.',
        'The organisation may suspend or deactivate accounts when access is no longer required or when misuse is suspected.',
      ],
    },
    {
      id: 'terms-acceptable',
      title: '2. Acceptable Use',
      subtitle: 'Appropriate use of the platform',
      icon: 'pi pi-check-circle',
      items: [
        'Use OfficeHub only for authorised business and work-related activities.',
        'Do not attempt to access modules, records or information without permission.',
        'Do not upload malicious files, harmful content or unauthorised material.',
        'Do not interfere with the availability, security or normal operation of the system.',
      ],
    },
    {
      id: 'terms-records',
      title: '3. Company Records',
      subtitle: 'Documents, requests and submissions',
      icon: 'pi pi-folder',
      items: [
        'Information submitted through OfficeHub should be accurate and complete.',
        'Employees are responsible for reviewing their submissions before sending them for approval.',
        'Company documents and records must be handled according to internal policies.',
        'Approval through OfficeHub does not override other applicable company procedures.',
      ],
    },
    {
      id: 'terms-monitoring',
      title: '4. System Administration',
      subtitle: 'Access control and system management',
      icon: 'pi pi-cog',
      items: [
        'Access to system modules and functions may depend on the user role and assigned permissions.',
        'Authorised administrators may manage accounts, permissions and system settings.',
        'System activities may be logged for security, operational and audit purposes.',
        'The organisation may update system functionality and internal procedures when necessary.',
      ],
    },
    {
      id: 'terms-violations',
      title: '5. Violations',
      subtitle: 'Misuse and policy breaches',
      icon: 'pi pi-exclamation-triangle',
      items: [
        'Unauthorised access, misuse of information or interference with system operations may be reported for investigation.',
        'Access restrictions or other internal actions may be taken in accordance with company policies.',
        'Suspected security incidents should be reported promptly to the appropriate administrator.',
      ],
    },
  ];

  readonly privacySections = [
    {
      id: 'privacy-collection',
      title: '1. Information We Handle',
      subtitle: 'Types of information in OfficeHub',
      icon: 'pi pi-database',
      items: [
        'Account information such as employee name, email address, department, job title and account status.',
        'Employment-related information used for employee management and internal administration.',
        'Operational information such as leave applications, claims, meeting records, project updates and work requests.',
        'Documents, attachments and supporting information submitted by users.',
        'Technical information such as access records and system activity logs, where enabled.',
      ],
    },
    {
      id: 'privacy-purpose',
      title: '2. How Information Is Used',
      subtitle: 'Purposes of processing',
      icon: 'pi pi-briefcase',
      items: [
        'To provide employee account access and manage user permissions.',
        'To process internal requests, approvals, leave applications and claims.',
        'To support communication, project coordination and daily business operations.',
        'To maintain system security, investigate issues and support auditing.',
        'To comply with applicable legal and organisational requirements.',
      ],
    },
    {
      id: 'privacy-sharing',
      title: '3. Information Sharing',
      subtitle: 'Who may access information',
      icon: 'pi pi-users',
      items: [
        'Information may be made available to authorised personnel according to their assigned responsibilities.',
        'HR, administrators and relevant approvers may access information required to perform their duties.',
        'Information may be disclosed when required by applicable law or a lawful request.',
        'Access should be limited to legitimate business and operational requirements.',
      ],
    },
    {
      id: 'privacy-security',
      title: '4. Data Security',
      subtitle: 'Protecting information',
      icon: 'pi pi-lock',
      items: [
        'The organisation should apply appropriate technical and organisational safeguards to protect information.',
        'Access should be controlled through authentication and role-based permissions.',
        'Users should log out when using shared devices and protect their login credentials.',
        'Suspected data loss, unauthorised access or disclosure should be reported immediately.',
      ],
    },
    {
      id: 'privacy-retention',
      title: '5. Data Retention',
      subtitle: 'Storage and deletion',
      icon: 'pi pi-calendar',
      items: [
        'Information should be retained only for as long as necessary for its intended business, legal or operational purpose.',
        'Retention periods should follow the organisation’s approved records management policy and applicable laws.',
        'When information is no longer required, it should be securely deleted, anonymised or archived as appropriate.',
      ],
    },
    {
      id: 'privacy-rights',
      title: '6. Your Information',
      subtitle: 'Access and correction requests',
      icon: 'pi pi-id-card',
      items: [
        'Employees should review their personal information and notify the appropriate department when corrections are required.',
        'Requests to access, correct or raise concerns about personal information should be directed to the organisation’s designated contact.',
        'Requests will be handled in accordance with applicable laws and internal procedures.',
      ],
    },
  ];
}
