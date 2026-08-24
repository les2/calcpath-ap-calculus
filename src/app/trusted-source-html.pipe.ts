import { Pipe, inject } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

/**
 * The practice importer emits an allowlisted HTML/MathML subset and the data
 * validator rejects executable markup. Angular's HTML sanitizer currently
 * removes MathML structure, so this boundary trusts only that published,
 * build-validated catalog content.
 */
@Pipe({ name: 'trustedSourceHtml', standalone: true })
export class TrustedSourceHtmlPipe {
  private readonly sanitizer = inject(DomSanitizer);
  transform(value: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(value); }
}
