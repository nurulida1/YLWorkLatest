import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { parseInventoryItemIdFromQr } from './inventory-qr.util';

@Component({
  selector: 'app-inventory-qr-scan-dialog',
  imports: [CommonModule, DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="visible"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      [dismissableMask]="true"
      [appendTo]="'body'"
      [baseZIndex]="12000"
      [autoZIndex]="true"
      header="Scan item QR"
      styleClass="w-[94%] max-w-lg"
    >
      <div class="flex flex-col gap-3">
        <p class="text-sm text-gray-600 leading-5 m-0">
          Point your camera at an inventory QR code. This keeps you inside YL
          Works (recommended on iPhone Home Screen).
        </p>

        <div
          [id]="readerId"
          class="w-full overflow-hidden rounded-xl border border-gray-200 bg-black min-h-[260px]"
        ></div>

        @if (statusMessage) {
          <p
            class="text-sm m-0"
            [class.text-rose-600]="!!error"
            [class.text-gray-500]="!error"
          >
            {{ statusMessage }}
          </p>
        }

        <div class="flex justify-end gap-2 pt-1">
          <p-button
            label="Close"
            severity="secondary"
            [outlined]="true"
            (onClick)="close()"
          ></p-button>
        </div>
      </div>
    </p-dialog>
  `,
})
export class InventoryQrScanDialog implements OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  /** Unique host id so repeated opens do not clash with leftover DOM. */
  readonly readerId = `inventory-qr-reader-${Math.random().toString(36).slice(2, 9)}`;

  @Output() visibleChange = new EventEmitter<boolean>();

  statusMessage = 'Starting camera…';
  error = false;

  private _visible = false;
  private scanner: { isScanning: boolean; stop: () => Promise<void>; clear: () => void } | null =
    null;
  private starting = false;
  private handled = false;
  private startTimer: number | null = null;

  @Input()
  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    const next = !!value;
    if (this._visible === next) return;
    this._visible = next;
    this.cdr.markForCheck();

    if (next) {
      this.handled = false;
      this.error = false;
      this.statusMessage = 'Starting camera…';
      this.scheduleStart();
    } else {
      this.clearStartTimer();
      void this.stopScanner();
    }
  }

  ngOnDestroy(): void {
    this.clearStartTimer();
    void this.stopScanner();
  }

  onVisibleChange(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  close(): void {
    this.onVisibleChange(false);
  }

  private scheduleStart(): void {
    this.clearStartTimer();
    // Wait until dialog content is in the DOM (appendTo body).
    this.startTimer = window.setTimeout(() => {
      this.startTimer = null;
      void this.startScanner();
    }, 150);
  }

  private clearStartTimer(): void {
    if (this.startTimer != null) {
      window.clearTimeout(this.startTimer);
      this.startTimer = null;
    }
  }

  private async startScanner(): Promise<void> {
    if (!this._visible || this.starting || this.scanner) return;

    const host = document.getElementById(this.readerId);
    if (!host) {
      this.error = true;
      this.statusMessage = 'Scanner UI failed to load. Close and try again.';
      this.cdr.markForCheck();
      return;
    }

    this.starting = true;
    try {
      const mod = await import('html5-qrcode');
      const Html5Qrcode = mod.Html5Qrcode;
      const Html5QrcodeSupportedFormats = mod.Html5QrcodeSupportedFormats;

      const scanner = new Html5Qrcode(this.readerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      this.scanner = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 8,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        (decoded: string) => void this.onDecoded(decoded),
        () => undefined,
      );

      this.error = false;
      this.statusMessage = 'Align the QR code inside the frame.';
      this.cdr.markForCheck();
    } catch (err) {
      console.error('Inventory QR scanner failed to start', err);
      this.error = true;
      this.statusMessage =
        'Could not open the camera. Allow camera permission for YL Works (HTTPS/localhost) and try again.';
      this.cdr.markForCheck();
      await this.stopScanner();
    } finally {
      this.starting = false;
    }
  }

  private async onDecoded(raw: string): Promise<void> {
    if (this.handled || !this._visible) return;

    const itemId = parseInventoryItemIdFromQr(raw);
    if (!itemId) {
      this.error = true;
      this.statusMessage =
        'That QR is not an inventory item link. Try another code.';
      this.cdr.markForCheck();
      return;
    }

    this.handled = true;
    this.error = false;
    this.statusMessage = 'Item found. Opening…';
    this.cdr.markForCheck();

    await this.stopScanner();
    this.onVisibleChange(false);

    this.messages.add({
      severity: 'success',
      summary: 'QR scanned',
      detail: 'Opening inventory item…',
      life: 2000,
    });

    void this.router.navigate(['/inventory/item', itemId]);
  }

  private async stopScanner(): Promise<void> {
    const scanner = this.scanner;
    this.scanner = null;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn('Inventory QR scanner stop failed', err);
    }

    try {
      scanner.clear();
    } catch {
      // element may already be gone
    }
  }
}
