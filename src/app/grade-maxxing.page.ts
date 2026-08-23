import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

export type PracticeGrade = 'cooked' | 'almost' | 'got-cooked';
export type Challenge = {
  id: string;
  topicId: string;
  topic: string;
  unit: string;
  problemNumber: string;
  source: string;
  problemUrl: string;
  solutionUrl: string;
  videoUrl: string;
  referenceUrl: string;
};
export type Attempt = {
  id: string;
  sessionId: string;
  challengeId: string;
  topicId: string;
  topic: string;
  grade: PracticeGrade;
  seconds: number;
  completedAt: string;
};

export function gradePoints(grade: PracticeGrade): number {
  return grade === 'cooked' ? 1 : grade === 'almost' ? 0.5 : 0;
}

export function levelLabel(attempts: Attempt[]): string {
  if (!attempts.length) return 'New';
  if (attempts.length < 3) return 'Warming up';
  const score = attempts.reduce((sum, attempt) => sum + gradePoints(attempt.grade), 0) / attempts.length;
  if (score >= 0.85) return 'Leveled up';
  if (score >= 0.5) return 'In the lab';
  return 'Needs reps';
}

@Component({
  standalone: true,
  template: `
    <section class="maxxing-hero">
      <div>
        <p class="eyebrow"><span>BETA</span> GRADE MAXXING</p>
        <h1>Lock in.<br><em>Level up.</em></h1>
        <p>Real calculus problems. Published solutions. Zero AI-generated questions. You do the work and call the result.</p>
      </div>
      <div class="maxxing-score" aria-hidden="true"><span>+1</span><b>REP</b><small>one problem at a time</small></div>
    </section>

    <main class="maxxing-page">
      @if (mode() === 'setup') {
        <section class="practice-setup" aria-labelledby="pick-heading">
          <div class="practice-heading"><div><p class="eyebrow">PICK YOUR GRIND</p><h2 id="pick-heading">What are we maxxing?</h2></div><p>Choose any topics. This first beta has eight educator-published problem cards with official worked solutions.</p></div>
          <div class="challenge-picker">
            @for (challenge of challenges(); track challenge.id) {
              <label class="challenge-choice" [class.selected]="selected().includes(challenge.id)" [style.--challenge-accent]="accentFor(challenge.topicId)">
                <input type="checkbox" [checked]="selected().includes(challenge.id)" (change)="toggleChallenge(challenge.id)">
                <span class="choice-check">✓</span>
                <span><small>{{challenge.unit}}</small><b>{{challenge.topic}}</b><em>{{challenge.topicId}} · {{challenge.problemNumber}}</em></span>
              </label>
            }
          </div>
          <div class="setup-actions"><button class="secondary-action" type="button" (click)="selectAll()">{{selected().length === challenges().length ? 'Clear all' : 'Select all'}}</button><button class="maxxing-primary" type="button" [disabled]="!selected().length" (click)="startSession()">Start {{selected().length || ''}}-card set →</button></div>
        </section>

        @if (attempts().length) {
          <section class="practice-history" aria-labelledby="history-heading">
            <div class="practice-heading"><div><p class="eyebrow">YOUR STATS</p><h2 id="history-heading">Receipts, not vibes.</h2></div><button class="text-action" type="button" (click)="clearHistory()">Reset practice data</button></div>
            <div class="topic-stats">
              @for (stat of topicStats(); track stat.topicId) {
                <article><span class="stat-level">{{stat.level}}</span><h3>{{stat.topic}}</h3><p><b>{{stat.score}}%</b> across {{stat.count}} {{stat.count === 1 ? 'rep' : 'reps'}}</p><small>Average solve time {{formatTime(stat.averageSeconds)}}</small><button type="button" (click)="practiceTopic(stat.challengeId)">Keep cooking →</button></article>
              }
            </div>
          </section>
        }
      } @else if (mode() === 'practice') {
        @if (current(); as card) {
          <section class="practice-session">
            <div class="session-topline"><button class="text-action" type="button" (click)="leaveSession()">← Leave set</button><span>{{currentIndex() + 1}} / {{session().length}}</span><div class="session-progress"><i [style.width.%]="sessionProgress()"></i></div></div>
            <article class="practice-card">
              <header><div><small>{{card.unit}}</small><h2>{{card.topic}}</h2><span>{{card.topicId}} · {{card.problemNumber}}</span></div><div class="card-timer" [class.stopped]="!running()"><small>{{running() ? 'LOCKED IN' : 'STOPPED'}}</small><b>{{formatTime(elapsed())}}</b><button type="button" (click)="toggleTimer()">{{running() ? 'Pause' : 'Resume'}}</button></div></header>
              <div class="problem-stage">
                <span class="stage-number">01</span>
                <div><p class="eyebrow">THE PROBLEM</p><h3>Open {{card.problemNumber}} and solve it on your own.</h3><p>The source page has several problems. Stay on the numbered problem shown here, then come back to check the published solution.</p><a class="source-button" [href]="card.problemUrl" target="_blank" rel="noopener noreferrer">Open problem ↗</a><small>{{card.source}}</small></div>
              </div>
              @if (!revealed()) {
                <button class="reveal-button" type="button" (click)="revealAnswer()">Stop timer + check answer</button>
              } @else {
                <div class="answer-stage">
                  <span class="stage-number">02</span>
                  <div><p class="eyebrow">CHECK YOUR WORK</p><h3>Compare with the published solution.</h3><a [href]="card.solutionUrl" target="_blank" rel="noopener noreferrer">Open official solution ↗</a><p>Be honest—the stats only belong to you.</p></div>
                </div>
                <div class="grade-actions" aria-label="Self-grade this attempt">
                  <button class="grade-correct" type="button" (click)="recordGrade('cooked')"><b>Cooked it</b><small>Correct</small></button>
                  <button class="grade-partial" type="button" (click)="recordGrade('almost')"><b>Almost cooked</b><small>Partial</small></button>
                  <button class="grade-wrong" type="button" (click)="recordGrade('got-cooked')"><b>Got cooked</b><small>Wrong</small></button>
                </div>
              }
              <div class="card-help"><span>Need a reset?</span><a [href]="card.videoUrl" target="_blank" rel="noopener noreferrer">▶ Watch lesson</a><a [href]="card.referenceUrl" target="_blank" rel="noopener noreferrer">Read reference ↗</a></div>
            </article>
          </section>
        }
      } @else {
        <section class="session-summary">
          <p class="eyebrow"><span>SET COMPLETE</span> NICE WORK</p>
          <h1>{{summaryTitle()}}</h1>
          <p>You put in {{formatTime(summary().seconds)}} across {{summary().count}} {{summary().count === 1 ? 'problem' : 'problems'}}. Saved on this device.</p>
          <div class="summary-grid"><article><b>{{summary().cooked}}</b><span>Cooked it</span><small>Correct</small></article><article><b>{{summary().almost}}</b><span>Almost cooked</span><small>Partial</small></article><article><b>{{summary().gotCooked}}</b><span>Got cooked</span><small>Wrong</small></article></div>
          <div class="summary-actions"><button class="secondary-action" type="button" (click)="leaveSession()">Pick new topics</button><button class="maxxing-primary" type="button" (click)="runItBack()">Run it back →</button></div>
        </section>
      }
    </main>
  `
})
export class GradeMaxxingPage {
  readonly challenges = signal<Challenge[]>([]);
  readonly selected = signal<string[]>([]);
  readonly session = signal<Challenge[]>([]);
  readonly currentIndex = signal(0);
  readonly sessionId = signal('');
  readonly elapsed = signal(0);
  readonly running = signal(false);
  readonly revealed = signal(false);
  readonly attempts = signal<Attempt[]>(this.readAttempts());
  readonly mode = computed<'setup' | 'practice' | 'summary'>(() => !this.session().length ? 'setup' : this.currentIndex() < this.session().length ? 'practice' : 'summary');
  readonly current = computed(() => this.session()[this.currentIndex()] ?? null);
  readonly sessionProgress = computed(() => this.session().length ? this.currentIndex() / this.session().length * 100 : 0);
  readonly summary = computed(() => {
    const attempts = this.attempts().filter((attempt) => attempt.sessionId === this.sessionId());
    return {
      count: attempts.length,
      seconds: attempts.reduce((sum, attempt) => sum + attempt.seconds, 0),
      cooked: attempts.filter((attempt) => attempt.grade === 'cooked').length,
      almost: attempts.filter((attempt) => attempt.grade === 'almost').length,
      gotCooked: attempts.filter((attempt) => attempt.grade === 'got-cooked').length
    };
  });
  readonly topicStats = computed(() => this.challenges().map((challenge) => {
    const attempts = this.attempts().filter((attempt) => attempt.challengeId === challenge.id);
    const score = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + gradePoints(attempt.grade), 0) / attempts.length * 100) : 0;
    const averageSeconds = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.seconds, 0) / attempts.length) : 0;
    return { challengeId: challenge.id, topicId: challenge.topicId, topic: challenge.topic, count: attempts.length, score, averageSeconds, level: levelLabel(attempts) };
  }).filter((stat) => stat.count));

  constructor(http: HttpClient, destroyRef: DestroyRef) {
    http.get<{challenges: Challenge[]}>(new URL('data/practice.json', document.baseURI).toString()).subscribe((data) => this.challenges.set(data.challenges));
    interval(1000).pipe(takeUntilDestroyed(destroyRef)).subscribe(() => { if (this.running()) this.elapsed.update((seconds) => seconds + 1); });
  }

  toggleChallenge(id: string) { this.selected.update((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); }
  selectAll() { this.selected.set(this.selected().length === this.challenges().length ? [] : this.challenges().map((challenge) => challenge.id)); }
  startSession() {
    const cards = this.challenges().filter((challenge) => this.selected().includes(challenge.id));
    if (!cards.length) return;
    this.session.set(cards);
    this.sessionId.set(crypto.randomUUID());
    this.currentIndex.set(0);
    this.resetCard();
  }
  practiceTopic(id: string) { this.selected.set([id]); this.startSession(); }
  revealAnswer() { this.running.set(false); this.revealed.set(true); }
  toggleTimer() { if (!this.revealed()) this.running.update((value) => !value); }
  recordGrade(grade: PracticeGrade) {
    const card = this.current();
    if (!card) return;
    const attempt: Attempt = { id: crypto.randomUUID(), sessionId: this.sessionId(), challengeId: card.id, topicId: card.topicId, topic: card.topic, grade, seconds: this.elapsed(), completedAt: new Date().toISOString() };
    this.attempts.update((attempts) => [...attempts, attempt]);
    localStorage.setItem('calcpath-practice-attempts', JSON.stringify(this.attempts()));
    this.currentIndex.update((index) => index + 1);
    if (this.currentIndex() < this.session().length) this.resetCard();
  }
  leaveSession() { this.running.set(false); this.session.set([]); this.currentIndex.set(0); this.sessionId.set(''); }
  runItBack() { this.sessionId.set(crypto.randomUUID()); this.currentIndex.set(0); this.resetCard(); }
  clearHistory() {
    if (!confirm('Reset all Grade Maxxing practice history on this device?')) return;
    this.attempts.set([]);
    localStorage.removeItem('calcpath-practice-attempts');
  }
  summaryTitle() { const value = this.summary(); return value.cooked === value.count ? 'You cooked.' : value.gotCooked > value.cooked ? 'Run it back.' : 'Leveling up.'; }
  formatTime(seconds: number) { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(seconds % 60).padStart(2, '0')}`; }
  accentFor(topicId: string) { return ['#ff6b35','#5d3fd3','#2478d4','#e65050','#b35bce','#008f7a','#b57812','#1b879c','#d6622a','#d73964'][Number(topicId.split('.')[0]) - 1]; }
  private resetCard() { this.elapsed.set(0); this.revealed.set(false); this.running.set(true); }
  private readAttempts(): Attempt[] { try { return JSON.parse(localStorage.getItem('calcpath-practice-attempts') ?? '[]') as Attempt[]; } catch { return []; } }
}
