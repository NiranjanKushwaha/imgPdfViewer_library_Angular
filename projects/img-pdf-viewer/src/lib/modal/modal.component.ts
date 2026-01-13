import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
} from '@angular/core';

@Component({
  selector: 'lib-custom-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class CustomModalComponent {
  @Input() size:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | 'full' = 'md';
  @Input() title: string = '';
  @Input() isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  onClose(): void {
    this.close.emit();
  }

  // Close when clicking backdrop
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isOpen) {
      this.onClose();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    // Only close if the click was directly on the backdrop (not inside the modal)
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}
