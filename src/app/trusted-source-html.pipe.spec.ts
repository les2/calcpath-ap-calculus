import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { TrustedSourceHtmlPipe } from './trusted-source-html.pipe';

describe('TrustedSourceHtmlPipe', () => {
  it('preserves validated MathML structure for the browser renderer', () => {
    const markup = '<math><msup><mi>x</mi><mn>2</mn></msup></math>';
    const pipe = TestBed.runInInjectionContext(() => new TrustedSourceHtmlPipe());
    const sanitizer = TestBed.inject(DomSanitizer);
    expect(sanitizer.sanitize(SecurityContext.HTML, pipe.transform(markup))).toBe(markup);
  });
});
