import { AfterViewInit, Component, ElementRef, Input, OnChanges } from '@angular/core';
import katex from 'katex';

@Component({
  selector: 'calc-math',
  standalone: true,
  template: '',
  host: { class: 'math-formula' }
})
export class MathFormulaComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) tex = '';
  private ready = false;

  constructor(private readonly element: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    this.ready = true;
    this.render();
  }

  ngOnChanges() {
    if (this.ready) this.render();
  }

  private render() {
    katex.render(this.tex, this.element.nativeElement, {
      displayMode: true,
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false
    });
  }
}
