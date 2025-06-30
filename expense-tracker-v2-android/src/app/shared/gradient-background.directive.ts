import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appGradientBackground]',
  standalone: true,
})
export class GradientBackgroundDirective implements OnChanges {
  @Input() percentage = 0; // Default to 50%

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['percentage']) {
      this.updateBackground();
    }
  }

  private updateBackground() {
    const gradient = `linear-gradient(to right, #62628e ${this.percentage}%, var(--ion-color-tertiary) ${this.percentage}%)`;
    this.renderer.setStyle(this.el.nativeElement, 'background', gradient);
  }
}
