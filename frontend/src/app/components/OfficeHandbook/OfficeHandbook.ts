import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { Menu, MenuModule } from 'primeng/menu';
import {
  CreateOfficeHandbook,
  CreateOfficeHandbookCategory,
  OfficeHandbook,
  OfficeHandbookCategory,
  UpdateOfficeHandbook,
  UpdateOfficeHandbookCategory,
} from '../../models/OfficeHandbook';
import { OfficeHandbookService } from '../../services/OfficeHandbookService';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-office-handbook',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MenuModule,
    DialogModule,
    CheckboxModule,
    SelectModule,
  ],
  template: ` <div class="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div class="space-y-6">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <a routerLink="/dashboard" class="hover:text-blue-600"> Dashboard </a>
          <i class="pi pi-angle-right text-xs"></i>
          <span class="font-medium text-slate-800">Office Handbook</span>
        </div>

        <!-- Page Heading -->
        <div
          class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div class="mb-2 flex items-center gap-2">
              <span class="rounded-lg bg-blue-100 p-2 text-blue-600">
                <i class="pi pi-book text-xl"></i>
              </span>
              <span
                class="text-sm font-semibold uppercase tracking-wider text-blue-600"
              >
                Employee Resources
              </span>
            </div>

            <h1
              class="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
            >
              Office Handbook
            </h1>

            <p class="mt-1 text-sm text-slate-500">
              Everything you need to know about company policies, guidelines and
              procedures.
            </p>
          </div>

          <!-- Admin Action -->
          <button
            *ngIf="canManage"
            type="button"
            (click)="openArticleActions($event)"
            class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Article actions"
          >
            <i class="pi pi-ellipsis-v"></i>
          </button>
        </div>

        <!-- Handbook Overview -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">Total Articles</p>
                <h3 class="mt-2 text-2xl font-bold text-slate-900">
                  {{ handbooks.length }}
                </h3>
              </div>
              <div class="rounded-xl bg-blue-50 p-3 text-blue-600">
                <i class="pi pi-file text-xl"></i>
              </div>
            </div>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">Categories</p>
                <h3 class="mt-2 text-2xl font-bold text-slate-900">
                  {{ categories.length }}
                </h3>
              </div>
              <div class="rounded-xl bg-purple-50 p-3 text-purple-600">
                <i class="pi pi-folder text-xl"></i>
              </div>
            </div>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-500">Published Articles</p>
                <h3 class="mt-2 text-2xl font-bold text-slate-900">
                  {{ publishedCount }}
                </h3>
              </div>
              <div class="rounded-xl bg-green-50 p-3 text-green-600">
                <i class="pi pi-check-circle text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <!-- Categories Sidebar -->
          <aside class="lg:col-span-1">
            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-bold text-slate-800">Categories</h2>

                <button
                  *ngIf="canManage"
                  type="button"
                  (click)="openCategoryDialog()"
                  title="Manage categories"
                  class="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <i class="pi pi-cog"></i>
                </button>
              </div>

              <div class="space-y-1">
                <button
                  type="button"
                  (click)="selectCategory(null)"
                  [ngClass]="
                    selectedCategoryId === null
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  "
                  class="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition"
                >
                  <span class="flex items-center gap-3">
                    <i class="pi pi-th-large"></i>
                    All Articles
                  </span>
                  <span class="text-xs">
                    {{ handbooks.length }}
                  </span>
                </button>

                <button
                  *ngFor="let category of categories"
                  type="button"
                  (click)="selectCategory(category.id)"
                  [ngClass]="
                    selectedCategoryId === category.id
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  "
                  class="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition"
                >
                  <span class="flex min-w-0 items-center gap-3">
                    <i class="pi pi-folder"></i>
                    <span class="truncate">{{ category.name }}</span>
                  </span>

                  <span class="shrink-0 text-xs">
                    {{ category.articleCount }}
                  </span>
                </button>
              </div>
            </div>
          </aside>

          <!-- Articles Section -->
          <section class="space-y-5 lg:col-span-3">
            <!-- Search and Filter -->
            <div
              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div class="flex flex-col gap-3 sm:flex-row">
                <div class="relative flex-1">
                  <i
                    class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  ></i>

                  <input
                    type="text"
                    [(ngModel)]="searchTerm"
                    placeholder="Search handbook articles..."
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <p-select
                  [(ngModel)]="publicationFilter"
                  *ngIf="canManage"
                  [options]="publicationOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="All Status"
                  styleClass="w-full md:w-44"
                  appendTo="body"
                >
                </p-select>
              </div>
            </div>

            <!-- Article Heading -->
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-slate-800">
                  {{ selectedCategoryName }}
                </h2>
                <p class="mt-1 text-sm text-slate-500">
                  {{ filteredHandbooks.length }} article(s) available
                </p>
              </div>
            </div>

            <!-- Loading -->
            <div
              *ngIf="isLoading"
              class="rounded-2xl border border-slate-200 bg-white py-16 text-center"
            >
              <i class="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
              <p class="mt-3 text-sm text-slate-500">
                Loading handbook articles...
              </p>
            </div>

            <!-- Article Cards -->
            <div
              *ngIf="!isLoading && filteredHandbooks.length > 0"
              class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div
                *ngFor="let article of filteredHandbooks"
                class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <div class="mb-4 flex items-start justify-between">
                  <div class="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <i class="pi pi-file-edit text-xl"></i>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Archived -->
                    <span
                      *ngIf="article.isArchived"
                      class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      Archived
                    </span>

                    <!-- Published -->
                    <span
                      *ngIf="!article.isArchived && article.isPublished"
                      class="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                    >
                      Published
                    </span>

                    <!-- Draft -->
                    <span
                      *ngIf="!article.isArchived && !article.isPublished"
                      class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                    >
                      Draft
                    </span>

                    <button
                      *ngIf="canManage"
                      type="button"
                      (click)="openArticleActions($event, article)"
                      class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Article actions"
                    >
                      <i class="pi pi-ellipsis-v"></i>
                    </button>
                  </div>
                </div>

                <p
                  class="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600"
                >
                  {{ article.categoryName }}
                </p>

                <h3
                  class="line-clamp-2 text-lg font-bold text-slate-800 transition group-hover:text-blue-700"
                >
                  {{ article.title }}
                </h3>

                <p
                  class="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500"
                >
                  {{ getArticlePreview(article.content) }}
                </p>

                <div
                  class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"
                >
                  <span class="text-xs text-slate-400">
                    {{
                      article.publishedAt
                        ? (article.publishedAt | date: 'dd MMM yyyy')
                        : (article.createdAt | date: 'dd MMM yyyy')
                    }}
                  </span>

                  <button
                    type="button"
                    (click)="viewArticle(article)"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    Read Article
                    <i class="pi pi-arrow-right text-xs"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              *ngIf="!isLoading && filteredHandbooks.length === 0"
              class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
            >
              <div
                class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
              >
                <i class="pi pi-book text-3xl"></i>
              </div>

              <h3 class="mt-4 font-bold text-slate-800">No Articles Found</h3>

              <p class="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                There are no handbook articles matching your search or selected
                category.
              </p>

              <button
                *ngIf="canManage"
                type="button"
                (click)="openCreateDialog()"
                class="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <i class="pi pi-plus mr-2"></i>
                Create First Article
              </button>
            </div>
          </section>
        </div>
      </div>
      <p-menu
        #articleMenu
        [popup]="true"
        [model]="menuItems"
        appendTo="body"
      ></p-menu>
    </div>
    <!-- Read Article Dialog -->
    <p-dialog
      [(visible)]="isReadDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '750px', maxWidth: '95vw' }"
      [breakpoints]="{ '768px': '95vw' }"
      styleClass="handbook-dialog"
    >
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-blue-50 p-3 text-blue-600">
            <i class="pi pi-book text-xl"></i>
          </div>

          <div>
            <h2 class="text-lg font-bold text-slate-800">
              {{ selectedArticle?.title }}
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              {{ selectedArticle?.categoryName }}
            </p>
          </div>
        </div>
      </ng-template>

      <div *ngIf="selectedArticle" class="py-3">
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"
        >
          <span class="text-sm text-slate-500">
            <i class="pi pi-calendar mr-2"></i>
            {{
              selectedArticle.publishedAt || selectedArticle.createdAt
                | date: 'dd MMMM yyyy'
            }}
          </span>

          <span
            *ngIf="selectedArticle.isPublished"
            class="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
          >
            Published
          </span>
        </div>

        <div
          class="handbook-article-content"
          [innerHTML]="selectedArticle.content"
        ></div>

        <div
          *ngIf="selectedArticle.attachmentPath"
          class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <i class="pi pi-paperclip text-xl text-blue-600"></i>

              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-800">
                  {{ selectedArticle.attachmentName || 'Attachment' }}
                </p>
                <p class="text-xs text-slate-500">Article attachment</p>
              </div>
            </div>

            <a
              [href]="selectedArticle.attachmentPath"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View <i class="pi pi-external-link ml-1"></i>
            </a>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button
          type="button"
          (click)="isReadDialogVisible = false"
          class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Close
        </button>
      </ng-template> </p-dialog
    ><!-- Add/Edit Article Dialog -->
    <p-dialog
      [(visible)]="isArticleDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '750px', maxWidth: '95vw' }"
      [breakpoints]="{ '768px': '95vw' }"
      styleClass="handbook-dialog"
      (onHide)="resetArticleForm()"
    >
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-blue-50 p-3 text-blue-600">
            <i
              [ngClass]="selectedArticle ? 'pi pi-pencil' : 'pi pi-plus'"
              class="text-xl"
            ></i>
          </div>

          <div>
            <h2 class="text-lg font-bold text-slate-800">
              {{ selectedArticle ? 'Edit Article' : 'Create Article' }}
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Add company policies, guidelines and procedures.
            </p>
          </div>
        </div>
      </ng-template>

      <div class="space-y-5 py-3">
        <!-- Title -->
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Article Title <span class="text-red-500">*</span>
          </label>

          <input
            type="text"
            [(ngModel)]="articleForm.title"
            (ngModelChange)="generateSlug()"
            placeholder="e.g. Annual Leave Policy"
            maxlength="200"
            class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Slug -->
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Article URL Slug <span class="text-red-500">*</span>
          </label>

          <input
            type="text"
            [(ngModel)]="articleForm.slug"
            placeholder="annual-leave-policy"
            maxlength="250"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />

          <p class="mt-1 text-xs text-slate-400">
            Used to identify the article in its URL.
          </p>
        </div>

        <!-- Category -->
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Category <span class="text-red-500">*</span>
          </label>

          <select
            [(ngModel)]="articleForm.categoryId"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select a category</option>

            <option
              *ngFor="let category of categories"
              [value]="category.id"
              [disabled]="!category.isActive"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Content -->
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Article Content <span class="text-red-500">*</span>
          </label>

          <textarea
            [(ngModel)]="articleForm.content"
            rows="12"
            placeholder="Write your handbook article here..."
            class="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          ></textarea>

          <p class="mt-1 text-xs text-slate-400">
            You can enter plain text for now. Rich text formatting can be added
            later.
          </p>
        </div>

        <!-- Publish Status -->
        <div
          class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div>
            <p class="text-sm font-semibold text-slate-800">Publish Article</p>
            <p class="mt-1 text-xs text-slate-500">
              Published articles are visible to employees.
            </p>
          </div>

          <p-checkbox
            [(ngModel)]="articleForm.isPublished"
            [binary]="true"
            inputId="publishArticle"
          ></p-checkbox>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            (click)="isArticleDialogVisible = false"
            class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            (click)="saveHandbook()"
            [disabled]="isSaving"
            class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i
              [ngClass]="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"
            ></i>

            {{
              isSaving
                ? 'Saving...'
                : selectedArticle
                  ? 'Update Article'
                  : 'Create Article'
            }}
          </button>
        </div>
      </ng-template> </p-dialog
    ><!-- Manage Categories Dialog -->
    <p-dialog
      [(visible)]="isCategoryDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '650px', maxWidth: '95vw' }"
      [breakpoints]="{ '768px': '95vw' }"
      styleClass="handbook-dialog"
    >
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-purple-50 p-3 text-purple-600">
            <i class="pi pi-folder text-xl"></i>
          </div>

          <div>
            <h2 class="text-lg font-bold text-slate-800">Manage Categories</h2>
            <p class="mt-1 text-xs text-slate-500">
              Organise your company handbook articles.
            </p>
          </div>
        </div>
      </ng-template>

      <div class="space-y-5 py-3">
        <!-- Category Form -->
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 class="mb-4 text-sm font-bold text-slate-800">
            {{ editingCategoryId ? 'Edit Category' : 'Add New Category' }}
          </h3>

          <div class="space-y-3">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">
                Category Name <span class="text-red-500">*</span>
              </label>

              <input
                type="text"
                [(ngModel)]="categoryForm.name"
                maxlength="150"
                placeholder="e.g. Human Resources"
                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                [(ngModel)]="categoryForm.description"
                rows="2"
                maxlength="500"
                placeholder="Brief category description..."
                class="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              ></textarea>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">
                Display Order
              </label>

              <input
                type="number"
                [(ngModel)]="categoryForm.displayOrder"
                min="0"
                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div *ngIf="editingCategoryId" class="flex items-center gap-2">
              <p-checkbox
                [(ngModel)]="categoryForm.isActive"
                [binary]="true"
                inputId="categoryActive"
              ></p-checkbox>

              <label for="categoryActive" class="text-sm text-slate-700">
                Active category
              </label>
            </div>

            <div class="flex justify-end gap-2">
              <button
                *ngIf="editingCategoryId"
                type="button"
                (click)="resetCategoryForm()"
                class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
              >
                Cancel Edit
              </button>

              <button
                type="button"
                (click)="saveCategory()"
                [disabled]="isSavingCategory"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{
                  isSavingCategory
                    ? 'Saving...'
                    : editingCategoryId
                      ? 'Update Category'
                      : 'Add Category'
                }}
              </button>
            </div>
          </div>
        </div>

        <!-- Existing Categories -->
        <div>
          <h3 class="mb-3 text-sm font-bold text-slate-800">
            Existing Categories
          </h3>

          <div
            *ngIf="categories.length === 0"
            class="rounded-xl border border-dashed border-slate-200 py-8 text-center"
          >
            <i class="pi pi-folder-open text-2xl text-slate-300"></i>
            <p class="mt-2 text-sm text-slate-500">No categories available.</p>
          </div>

          <div
            *ngFor="let category of categories"
            class="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div class="rounded-lg bg-purple-50 p-2 text-purple-600">
                <i class="pi pi-folder"></i>
              </div>

              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-800">
                  {{ category.name }}
                </p>

                <p class="text-xs text-slate-500">
                  {{ category.articleCount }} article(s)
                  <span class="mx-1">·</span>
                  {{ category.isActive ? 'Active' : 'Inactive' }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="editCategory(category)"
              class="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
              title="Edit category"
            >
              <i class="pi pi-pencil"></i>
            </button>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button
          type="button"
          (click)="isCategoryDialogVisible = false"
          class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </ng-template> </p-dialog
    ><!-- Confirmation Dialog -->
    <p-dialog
      [(visible)]="isConfirmDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="!isProcessingAction"
      [closeOnEscape]="!isProcessingAction"
      [dismissableMask]="!isProcessingAction"
      [style]="{ width: '450px', maxWidth: '95vw' }"
      styleClass="handbook-dialog"
      (onHide)="cancelConfirmation()"
    >
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          <div
            class="rounded-xl p-3"
            [ngClass]="
              confirmAction === 'archive'
                ? 'bg-red-50 text-red-600'
                : 'bg-blue-50 text-blue-600'
            "
          >
            <i
              [ngClass]="
                confirmAction === 'archive' ? 'pi pi-archive' : 'pi pi-undo'
              "
              class="text-xl"
            ></i>
          </div>

          <div>
            <h2 class="text-lg font-bold text-slate-800">
              {{
                confirmAction === 'archive'
                  ? 'Archive Article'
                  : 'Unarchive Article'
              }}
            </h2>

            <p class="mt-1 text-xs text-slate-500">
              Please confirm your action.
            </p>
          </div>
        </div>
      </ng-template>

      <div class="py-3">
        <p class="text-sm leading-relaxed text-slate-600">
          Are you sure you want to
          <span class="font-semibold text-slate-800">
            {{ confirmAction === 'archive' ? 'archive' : 'unarchive' }}
          </span>
          this article?
        </p>

        <div
          *ngIf="articlePendingAction"
          class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <p class="text-sm font-semibold text-slate-800">
            {{ articlePendingAction.title }}
          </p>

          <p class="mt-1 text-xs text-slate-500">
            {{ articlePendingAction.categoryName }}
          </p>
        </div>

        <p
          *ngIf="confirmAction === 'archive'"
          class="mt-3 text-xs text-red-600"
        >
          This article will no longer be visible to employees.
        </p>

        <p
          *ngIf="confirmAction === 'restore'"
          class="mt-3 text-xs text-blue-600"
        >
          The article will be restored as a draft.
        </p>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <button
            type="button"
            (click)="cancelConfirmation()"
            [disabled]="isProcessingAction"
            class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            (click)="confirmArticleAction()"
            [disabled]="isProcessingAction || !articlePendingAction"
            [ngClass]="
              confirmAction === 'archive'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            "
            class="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i
              [ngClass]="
                isProcessingAction
                  ? 'pi pi-spin pi-spinner'
                  : confirmAction === 'archive'
                    ? 'pi pi-archive'
                    : 'pi pi-undo'
              "
            ></i>

            {{
              isProcessingAction
                ? 'Processing...'
                : confirmAction === 'archive'
                  ? 'Archive Article'
                  : 'Unarchive Article'
            }}
          </button>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './OfficeHandbook.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeHandbookComponent implements OnInit {
  private handbookService = inject(OfficeHandbookService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('articleMenu') articleMenu!: Menu;

  // Data
  handbooks: OfficeHandbook[] = [];
  categories: OfficeHandbookCategory[] = [];

  selectedArticle: OfficeHandbook | null = null;
  menuArticle: OfficeHandbook | null = null;
  // Permission
  // TODO: Connect this to your existing AuthService / permission system.
  canManage: boolean = true;

  // Loading states
  isLoading: boolean = false;
  isSaving: boolean = false;
  isSavingCategory: boolean = false;

  // Search and filters
  searchTerm: string = '';
  publicationFilter: 'all' | 'published' | 'draft' | 'archived' = 'all';
  selectedCategoryId: string | null = null;

  // Dialog visibility
  isReadDialogVisible: boolean = false;
  isArticleDialogVisible: boolean = false;
  isCategoryDialogVisible: boolean = false;

  // Category editing
  editingCategoryId: string | null = null;

  // Article form
  articleForm: CreateOfficeHandbook = {
    title: '',
    slug: '',
    content: '',
    categoryId: '',
    isPublished: false,
  };

  // Category form
  categoryForm: UpdateOfficeHandbookCategory = {
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  };

  publicationOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ];

  // Article action menu
  menuItems: MenuItem[] = [];

  isConfirmDialogVisible: boolean = false;
  confirmAction: 'archive' | 'restore' | null = null;
  articlePendingAction: OfficeHandbook | null = null;
  isProcessingAction: boolean = false;

  ngOnInit(): void {
    this.GetData();
  }

  // ==========================================
  // DATA LOADING
  // ==========================================

  GetData(): void {
    this.isLoading = true;

    this.handbookService.GetHandbooks().subscribe({
      next: (response) => {
        this.handbooks = response ?? [];
        this.GetCategories();
      },
      error: (error) => {
        console.error('Error loading handbook articles:', error);

        this.handbooks = [];
        this.isLoading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load handbook articles.',
        });
      },
    });
  }

  GetCategories(): void {
    this.handbookService.GetCategories().subscribe({
      next: (response) => {
        this.categories = response ?? [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading handbook categories:', error);

        this.categories = [];
        this.isLoading = false;
        this.cdr.markForCheck();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load handbook categories.',
        });
      },
    });
  }

  // ==========================================
  // OVERVIEW
  // ==========================================

  get publishedCount(): number {
    return this.handbooks.filter(
      (article) => article.isPublished && !article.isArchived,
    ).length;
  }

  get selectedCategoryName(): string {
    if (!this.selectedCategoryId) {
      return 'All Articles';
    }

    return (
      this.categories.find(
        (category) => category.id === this.selectedCategoryId,
      )?.name ?? 'All Articles'
    );
  }

  // ==========================================
  // CATEGORY FILTERING
  // ==========================================

  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId = categoryId;
  }

  // ==========================================
  // ARTICLE SEARCH AND FILTERING
  // ==========================================

  get filteredHandbooks(): OfficeHandbook[] {
    let result = [...this.handbooks];

    // Non-managers only see published, non-archived articles.
    if (!this.canManage) {
      result = result.filter(
        (article) => article.isPublished && !article.isArchived,
      );
    }

    // Category filter
    if (this.selectedCategoryId) {
      result = result.filter(
        (article) => article.categoryId === this.selectedCategoryId,
      );
    }

    // Publication status filter
    if (this.canManage) {
      switch (this.publicationFilter) {
        case 'published':
          result = result.filter(
            (article) => article.isPublished && !article.isArchived,
          );
          break;

        case 'draft':
          result = result.filter(
            (article) => !article.isPublished && !article.isArchived,
          );
          break;

        case 'archived':
          result = result.filter((article) => article.isArchived);
          break;

        case 'all':
        default:
          // Show all articles, including archived ones.
          break;
      }
    }

    // Search
    const keyword = this.searchTerm.trim().toLowerCase();

    if (keyword) {
      result = result.filter((article) => {
        const title = article.title?.toLowerCase() ?? '';
        const category = article.categoryName?.toLowerCase() ?? '';
        const content = this.getArticlePreview(article.content).toLowerCase();

        return (
          title.includes(keyword) ||
          category.includes(keyword) ||
          content.includes(keyword)
        );
      });
    }

    return result;
  }

  getArticlePreview(content: string | null | undefined): string {
    if (!content) {
      return 'No article description available.';
    }

    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ==========================================
  // READ ARTICLE
  // ==========================================

  viewArticle(article: OfficeHandbook): void {
    this.selectedArticle = article;
    this.isReadDialogVisible = true;
  }

  // ==========================================
  // CREATE ARTICLE
  // ==========================================

  openCreateDialog(): void {
    if (!this.canManage) {
      return;
    }

    this.selectedArticle = null;
    this.resetArticleForm();

    this.isArticleDialogVisible = true;
  }

  // ==========================================
  // EDIT ARTICLE
  // ==========================================

  openEditDialog(article: OfficeHandbook): void {
    if (!this.canManage) {
      return;
    }

    this.selectedArticle = article;

    this.articleForm = {
      title: article.title,
      slug: article.slug,
      content: article.content,
      categoryId: article.categoryId,
      isPublished: article.isPublished,
    };

    this.isArticleDialogVisible = true;
  }

  // ==========================================
  // GENERATE SLUG
  // ==========================================

  generateSlug(): void {
    this.articleForm.slug = this.articleForm.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // ==========================================
  // SAVE ARTICLE
  // ==========================================

  saveHandbook(): void {
    if (!this.canManage || this.isSaving) {
      return;
    }

    const title = this.articleForm.title.trim();
    const slug = this.articleForm.slug.trim();
    const content = this.articleForm.content.trim();
    const categoryId = this.articleForm.categoryId;

    if (!title || !slug || !content || !categoryId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required Fields',
        detail: 'Please complete all required article fields.',
      });

      return;
    }

    const payload: CreateOfficeHandbook = {
      title,
      slug,
      content,
      categoryId,
      isPublished: this.articleForm.isPublished,
    };

    this.isSaving = true;

    if (this.selectedArticle) {
      const updatePayload: UpdateOfficeHandbook = payload;

      this.handbookService
        .UpdateHandbook(this.selectedArticle.id, updatePayload)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.isArticleDialogVisible = false;

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Handbook article updated successfully.',
            });

            this.GetData();
          },
          error: (error) => {
            console.error('Error updating handbook article:', error);
            this.isSaving = false;

            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                error?.error?.message ?? 'Unable to update handbook article.',
            });
          },
        });

      return;
    }

    this.handbookService.CreateHandbook(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isArticleDialogVisible = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Handbook article created successfully.',
        });

        this.GetData();
      },
      error: (error) => {
        console.error('Error creating handbook article:', error);
        this.isSaving = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message ?? 'Unable to create handbook article.',
        });
      },
    });
  }

  resetArticleForm(): void {
    this.articleForm = {
      title: '',
      slug: '',
      content: '',
      categoryId: '',
      isPublished: false,
    };

    this.selectedArticle = null;
    this.isSaving = false;
  }

  // ==========================================
  // ARTICLE ACTION MENU
  // ==========================================

  openArticleActions(event: Event, article?: OfficeHandbook): void {
    if (!this.canManage) {
      return;
    }

    this.menuArticle = article ?? null;

    if (this.menuArticle) {
      const selectedArticle = this.menuArticle;

      if (selectedArticle.isArchived) {
        this.menuItems = [
          {
            label: 'View Article',
            icon: 'pi pi-eye',
            command: () => this.viewArticle(selectedArticle),
          },
          {
            separator: true,
          },
          {
            label: 'Unarchive Article',
            icon: 'pi pi-undo',
            command: () => this.restoreHandbook(selectedArticle),
          },
        ];
      } else {
        this.menuItems = [
          {
            label: 'View Article',
            icon: 'pi pi-eye',
            command: () => this.viewArticle(selectedArticle),
          },
          {
            label: 'Edit Article',
            icon: 'pi pi-pencil',
            command: () => this.openEditDialog(selectedArticle),
          },
          {
            separator: true,
          },
          {
            label: 'Archive Article',
            icon: 'pi pi-archive',
            styleClass: 'text-red-600',
            command: () => this.archiveHandbook(selectedArticle),
          },
        ];
      }
    } else {
      this.menuItems = [
        {
          label: 'Add New Article',
          icon: 'pi pi-plus',
          command: () => this.openCreateDialog(),
        },
        {
          label: 'Manage Categories',
          icon: 'pi pi-folder',
          command: () => this.openCategoryDialog(),
        },
      ];
    }

    this.articleMenu.toggle(event);
  }

  // ==========================================
  // ARCHIVE ARTICLE
  // ==========================================

  archiveHandbook(article: OfficeHandbook): void {
    if (!this.canManage || article.isArchived) {
      return;
    }

    this.articlePendingAction = article;
    this.confirmAction = 'archive';
    this.isConfirmDialogVisible = true;
  }

  // ==========================================
  // CATEGORY MANAGEMENT
  // ==========================================

  openCategoryDialog(): void {
    if (!this.canManage) {
      return;
    }

    this.resetCategoryForm();
    this.isCategoryDialogVisible = true;
  }

  editCategory(category: OfficeHandbookCategory): void {
    if (!this.canManage) {
      return;
    }

    this.editingCategoryId = category.id;

    this.categoryForm = {
      name: category.name,
      description: category.description ?? '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    };
  }

  saveCategory(): void {
    if (!this.canManage || this.isSavingCategory) {
      return;
    }

    const name = this.categoryForm.name.trim();

    if (!name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required Field',
        detail: 'Please enter a category name.',
      });

      return;
    }

    this.isSavingCategory = true;

    if (this.editingCategoryId) {
      const updatePayload: UpdateOfficeHandbookCategory = {
        name,
        description: this.categoryForm.description?.trim() || null,
        displayOrder: Number(this.categoryForm.displayOrder) || 0,
        isActive: this.categoryForm.isActive,
      };

      this.handbookService
        .UpdateCategory(this.editingCategoryId, updatePayload)
        .subscribe({
          next: () => {
            this.isSavingCategory = false;

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Category updated successfully.',
            });

            this.resetCategoryForm();
            this.GetData();
          },
          error: (error) => {
            console.error('Error updating category:', error);
            this.isSavingCategory = false;

            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error?.error?.message ?? 'Unable to update category.',
            });
          },
        });

      return;
    }

    const createPayload: CreateOfficeHandbookCategory = {
      name,
      description: this.categoryForm.description?.trim() || null,
      displayOrder: Number(this.categoryForm.displayOrder) || 0,
    };

    this.handbookService.CreateCategory(createPayload).subscribe({
      next: () => {
        this.isSavingCategory = false;
        this.isCategoryDialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Category created successfully.',
        });

        this.resetCategoryForm();

        // Refresh the category list after creating a category.
        this.GetCategories();
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.isSavingCategory = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message ?? 'Unable to create category.',
        });
      },
    });
  }

  resetCategoryForm(): void {
    this.editingCategoryId = null;

    this.categoryForm = {
      name: '',
      description: '',
      displayOrder: 0,
      isActive: true,
    };

    this.isSavingCategory = false;
  }

  // ==========================================
  // CLOSE DIALOGS
  // ==========================================

  closeDialogs(): void {
    this.isReadDialogVisible = false;
    this.isArticleDialogVisible = false;
    this.isCategoryDialogVisible = false;

    this.selectedArticle = null;
    this.resetArticleForm();
    this.resetCategoryForm();
  }

  // ==========================================
  // RESTORE ARCHIVED ARTICLE
  // ==========================================

  restoreHandbook(article: OfficeHandbook): void {
    if (!this.canManage || !article.isArchived) {
      return;
    }

    this.articlePendingAction = article;
    this.confirmAction = 'restore';
    this.isConfirmDialogVisible = true;
  }

  // ==========================================
  // CONFIRM ARTICLE ACTION
  // ==========================================

  confirmArticleAction(): void {
    if (
      !this.canManage ||
      this.isProcessingAction ||
      !this.articlePendingAction ||
      !this.confirmAction
    ) {
      return;
    }

    const article = this.articlePendingAction;
    const action = this.confirmAction;

    this.isProcessingAction = true;

    const request$ =
      action === 'archive'
        ? this.handbookService.ArchiveHandbook(article.id)
        : this.handbookService.RestoreHandbook(article.id);

    request$.subscribe({
      next: () => {
        if (action === 'archive') {
          const archivedArticle = this.handbooks.find(
            (item) => item.id === article.id,
          );

          if (archivedArticle) {
            archivedArticle.isArchived = true;
            archivedArticle.isPublished = false;
          }
        }

        this.isProcessingAction = false;
        this.isConfirmDialogVisible = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail:
            action === 'archive'
              ? 'Handbook article archived successfully.'
              : 'Handbook article restored successfully as a draft.',
        });

        if (action === 'restore') {
          this.GetData();
        }

        this.cancelConfirmation();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error(
          `Error ${action === 'archive' ? 'archiving' : 'restoring'} handbook article:`,
          error,
        );

        this.isProcessingAction = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            error?.error?.message ??
            `Unable to ${action === 'archive' ? 'archive' : 'restore'} handbook article.`,
        });

        this.cdr.markForCheck();
      },
    });
  }

  // ==========================================
  // CANCEL CONFIRMATION
  // ==========================================

  cancelConfirmation(): void {
    if (this.isProcessingAction) {
      return;
    }

    this.isConfirmDialogVisible = false;
    this.confirmAction = null;
    this.articlePendingAction = null;

    this.cdr.markForCheck();
  }
}
