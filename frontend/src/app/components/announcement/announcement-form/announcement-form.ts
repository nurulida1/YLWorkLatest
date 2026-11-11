import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { EditorModule } from 'primeng/editor';
import { finalize, Subject, takeUntil } from 'rxjs';
import { CreateNoticeRequest } from '../../../models/Notice';
import { LoadingService } from '../../../services/loading.service';
import { NoticeService } from '../../../services/NoticeService';
import { UserService } from '../../../services/userService.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    CheckboxModule,
    EditorModule,
  ],
  template: `
    <div class="announcement-form-page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/dashboard"> Dashboard </a>

        <i class="pi pi-angle-right"></i>

        <a routerLink="/announcements">Announcements</a>

        <i class="pi pi-angle-right"></i>

        <span>Create Announcement</span>
      </nav>

      <!-- Header -->
      <div class="page-header">
        <div class="header-icon">
          <i class="pi pi-megaphone"></i>
        </div>

        <div class="header-text">
          <h1>Create Announcement</h1>
          <p>Share important company updates with your employees.</p>
        </div>
      </div>

      <!-- Form -->
      <section class="form-card">
        <div class="form-card-header">
          <div>
            <h2>Announcement Details</h2>
            <p>Complete the information below to publish a new notice.</p>
          </div>
        </div>

        <div class="form-content">
          <!-- Title -->
          <div class="form-field">
            <label for="noticeTitle">
              Announcement Title
              <span class="required">*</span>
            </label>

            <input
              id="noticeTitle"
              pInputText
              type="text"
              [(ngModel)]="noticeForm.title"
              placeholder="Enter announcement title"
              maxlength="200"
              class="w-full"
            />

            <small class="field-hint"> Maximum 200 characters. </small>
          </div>

          <!-- Content -->
          <div class="form-field">
            <label for="noticeContent">Announcement Content</label>

            <p-editor
              id="noticeContent"
              [(ngModel)]="noticeForm.content"
              [style]="{ height: '280px' }"
              placeholder="Write your announcement..."
              styleClass="announcement-content-editor"
              (onInit)="onContentEditorInit($event)"
            >
              <ng-template #header>
                <span class="ql-formats">
                  <select class="ql-header">
                    <option value="1"></option>
                    <option value="2"></option>
                    <option value="3"></option>
                    <option selected></option>
                  </select>
                </span>
                <span class="ql-formats">
                  <button
                    type="button"
                    class="ql-bold"
                    aria-label="Bold"
                  ></button>
                  <button
                    type="button"
                    class="ql-italic"
                    aria-label="Italic"
                  ></button>
                  <button
                    type="button"
                    class="ql-underline"
                    aria-label="Underline"
                  ></button>
                  <button
                    type="button"
                    class="ql-strike"
                    aria-label="Strike"
                  ></button>
                </span>
                <span class="ql-formats">
                  <button
                    type="button"
                    class="ql-list"
                    value="ordered"
                    aria-label="Ordered List"
                  ></button>
                  <button
                    type="button"
                    class="ql-list"
                    value="bullet"
                    aria-label="Unordered List"
                  ></button>
                </span>
                <span class="ql-formats">
                  <button
                    type="button"
                    class="ql-link"
                    aria-label="Insert Link"
                  ></button>
                  <button
                    type="button"
                    class="ql-image"
                    aria-label="Insert Image"
                  ></button>
                  <button
                    type="button"
                    class="ql-clean"
                    aria-label="Remove Formatting"
                  ></button>
                </span>
              </ng-template>
            </p-editor>
          </div>

          <!-- Dates -->
          <div class="date-fields">
            <div class="form-field">
              <label for="publishDate">Publish Date</label>

              <p-datepicker
                inputId="publishDate"
                [(ngModel)]="noticeForm.publishDate"
                [showTime]="true"
                hourFormat="12"
                [showIcon]="true"
                [showClear]="false"
                placeholder="Select publish date"
                styleClass="w-full"
                appendTo="body"
              ></p-datepicker>
            </div>

            <div class="form-field">
              <label for="expiryDate">Expiry Date</label>

              <p-datepicker
                inputId="expiryDate"
                [(ngModel)]="noticeForm.expiryDate"
                [showTime]="true"
                hourFormat="12"
                [showIcon]="true"
                placeholder="No expiry date"
                styleClass="w-full"
                appendTo="body"
              ></p-datepicker>

              <small class="field-hint">
                Leave empty if this announcement has no expiry date.
              </small>
            </div>
          </div>

          <!-- Pin -->
          <div class="pin-option">
            <p-checkbox
              [(ngModel)]="noticeForm.isPinned"
              [binary]="true"
              inputId="pinNotice"
            ></p-checkbox>

            <label for="pinNotice">
              <strong>Pin this announcement</strong>
              <span> Pinned announcements appear before other notices. </span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button
            pButton
            type="button"
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            (click)="GoBack()"
            [disabled]="savingNotice"
          ></button>

          <button
            pButton
            type="button"
            label="Publish Notice"
            icon="pi pi-send"
            class="bg-blue-700! border-none! hover:bg-blue-500!"
            (click)="SaveNotice()"
            [loading]="savingNotice"
            [disabled]="!noticeForm.title.trim()"
          ></button>
        </div>
      </section>
    </div>
  `,
  styleUrl: './announcement-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly loadingService = inject(LoadingService);
  private readonly noticeService = inject(NoticeService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly ngUnsubscribe = new Subject<void>();

  savingNotice = false;

  noticeForm: CreateNoticeRequest = this.getEmptyNotice();

  ngOnInit(): void {
    if (!this.isHrOrSuperAdmin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Access Denied',
        detail: 'Only HR and SuperAdmin can create notices.',
      });

      this.router.navigate(['/announcements']);
    }
  }

  get isHrOrSuperAdmin(): boolean {
    const role = this.userService.currentUser?.systemRole?.toLowerCase();

    return role === 'hr' || role === 'superadmin';
  }

  private getEmptyNotice(): CreateNoticeRequest {
    return {
      title: '',
      content: '',
      publishDate: new Date(),
      expiryDate: undefined,
      isPinned: false,
    };
  }

  GoBack(): void {
    if (!this.savingNotice) {
      this.router.navigate(['/announcements']);
    }
  }

  onContentEditorInit(event: { editor: any }): void {
    const quill = event?.editor;
    if (!quill) return;

    const toolbar = quill.getModule('toolbar');
    toolbar?.addHandler('image', () => this.insertEditorImage(quill));
  }

  private insertEditorImage(quill: any): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp';
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 5_000_000) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Image too large',
          detail: 'Please choose an image that is 5MB or smaller.',
        });
        return;
      }

      this.messageService.add({
        severity: 'info',
        summary: 'Uploading',
        detail: 'Uploading image…',
        life: 1500,
      });

      this.noticeService.UploadImage(file).subscribe({
        next: (res) => {
          const relative = (res.url || '').replace(/^\/+/, '');
          const url = relative.startsWith('http')
            ? relative
            : `${environment.AttachmentUrl}${relative}`;

          const range =
            quill.getSelection(true) || { index: quill.getLength(), length: 0 };
          quill.insertEmbed(range.index, 'image', url, 'user');
          quill.setSelection(range.index + 1, 0, 'user');
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Upload failed',
            detail:
              error?.error?.message ??
              'Unable to upload image. Please try again.',
          });
        },
      });
    };
  }

  SaveNotice(): void {
    if (!this.isHrOrSuperAdmin || this.savingNotice) {
      return;
    }

    if (!this.noticeForm.title.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter a notice title.',
      });
      return;
    }

    if (
      this.noticeForm.expiryDate &&
      this.noticeForm.publishDate &&
      this.noticeForm.expiryDate < this.noticeForm.publishDate
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Expiry date cannot be earlier than publish date.',
      });
      return;
    }

    const request: CreateNoticeRequest = {
      ...this.noticeForm,
      title: this.noticeForm.title.trim(),
      content: this.noticeForm.content?.trim(),
    };

    this.savingNotice = true;
    this.loadingService.start();

    this.noticeService
      .Create(request)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.savingNotice = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Notice created successfully.',
          });

          this.router.navigate(['/announcements']);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.Error ||
              err.error?.message ||
              'Failed to create notice.',
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
