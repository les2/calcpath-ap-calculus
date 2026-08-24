import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval } from 'rxjs';
import { MathFormulaComponent } from './math-formula.component';

export type PracticeGrade = 'cooked' | 'close' | 'reps';
export type QuestionLicense = { code: string; name: string; url: string; usage: 'embedded' | 'link-only' };
export type QuestionSource = { title: string; author: string; url: string; attribution: string; license: QuestionLicense; exerciseId?: string; promptUrl?: string; answerUrl?: string; transcription?: 'format-only' | 'link-only'; verifiedAt?: string };
export type QuestionMetadata = { sourceQuestionId: string; collection: string; course: string; format: string; difficulty: string; estimatedMinutes: number; calculator: string; answerKind: string; publishedYear?: number; tags: string[] };
export type PracticeQuestion = {
  id: string; type: 'embedded' | 'external'; topicId: string; topic: string; unit: string; title: string;
  promptText?: string; promptTex?: string; answerText?: string; answerTex?: string; problemUrl?: string; solutionUrl?: string;
  videoUrl: string; referenceUrl: string; metadata: QuestionMetadata; source: QuestionSource;
};
export type StudySession = {
  id: string; name: string; topicIds: string[]; questionIds: string[]; currentIndex: number; totalSeconds: number;
  results: Record<string, PracticeGrade>; revealed: string[]; status: 'open' | 'dismissed'; createdAt: string; updatedAt: string; questionLimitPerTopic?: number; selectionSeed?: number;
};

export function gradePoints(grade: PracticeGrade): number { return grade === 'cooked' ? 1 : grade === 'close' ? 0.5 : 0; }
export function completionCount(session: Pick<StudySession, 'results'>): number { return Object.keys(session.results).length; }
export function sessionScore(session: Pick<StudySession, 'results'>): number {
  const grades = Object.values(session.results);
  return grades.length ? Math.round(grades.reduce((sum, grade) => sum + gradePoints(grade), 0) / grades.length * 100) : 0;
}
export function reconcileSessionQuestions(session: StudySession, validQuestionIds: Set<string>): StudySession | null {
  const questionIds = session.questionIds.filter((id) => validQuestionIds.has(id));
  if (!questionIds.length) return null;
  const results = Object.fromEntries(Object.entries(session.results).filter(([id]) => validQuestionIds.has(id)));
  const revealed = session.revealed.filter((id) => validQuestionIds.has(id));
  return { ...session, questionIds, results, revealed, currentIndex: Math.min(session.currentIndex, questionIds.length - 1) };
}
export function selectBalancedQuestions(questions: PracticeQuestion[], topicIds: string[], limitPerTopic: number, selectionSeed = 0): PracticeQuestion[] {
  const selected: PracticeQuestion[] = [];
  for (const topicId of topicIds) {
    const groups = new Map<string, PracticeQuestion[]>();
    for (const question of questions.filter((item) => item.topicId === topicId)) {
      const group = groups.get(question.source.author) ?? [];
      group.push(question);
      groups.set(question.source.author, group);
    }
    const queues = [...groups.values()].map((queue) => queue.length ? [...queue.slice(selectionSeed % queue.length), ...queue.slice(0, selectionSeed % queue.length)] : queue);
    const target = Math.min(Math.max(1, Math.floor(limitPerTopic)), queues.reduce((sum, queue) => sum + queue.length, 0));
    for (let round = 0; selected.filter((item) => item.topicId === topicId).length < target; round += 1) {
      let added = false;
      for (const queue of queues) {
        const question = queue[round];
        if (question && selected.filter((item) => item.topicId === topicId).length < target) { selected.push(question); added = true; }
      }
      if (!added) break;
    }
  }
  return selected;
}

@Component({
  standalone: true,
  imports: [FormsModule, MathFormulaComponent],
  template: `
    <section class="maxxing-hero">
      <div><p class="eyebrow"><span>BETA</span> GRADE MAXXING</p><h1>Lock in.<br><em>Level up.</em></h1><p>Build a study run for your next test. Pick the topics, put in reps, and come back whenever you want.</p></div>
      <div class="maxxing-score" aria-hidden="true"><span>+1</span><b>REP</b><small>one problem at a time</small></div>
    </section>

    <main class="maxxing-page">
      @if (activeSession(); as study) {
        <section class="study-workspace">
          <header class="study-toolbar">
            <div><button class="text-action" type="button" (click)="endForNow()">← Your study runs</button><p class="eyebrow">{{study.name}}</p><h2>{{questionCountLabel(study)}}</h2></div>
            <div class="study-clock" [class.running]="running()"><small>{{running() ? 'LOCKED IN' : 'PAUSED'}}</small><b>{{formatTime(study.totalSeconds)}}</b><div><button type="button" (click)="toggleTimer()">{{running() ? 'Pause' : 'Start timer'}}</button><button type="button" (click)="openTimerEditor()">Edit</button></div></div>
          </header>

          @if (editingTimer()) {
            <section class="timer-editor" aria-label="Edit study timer"><label>Total minutes <input type="number" min="0" step="1" [ngModel]="timerMinutes()" (ngModelChange)="timerMinutes.set($event)"></label><button class="maxxing-primary" type="button" (click)="saveTimer()">Save time</button><button class="secondary-action" type="button" (click)="editingTimer.set(false)">Cancel</button><button class="text-action" type="button" (click)="resetTimer()">Reset to zero</button></section>
          }

          <p class="own-work-note"><b>Using your teacher’s study guide?</b> Keep the timer running and work from that. The clock belongs to you, not the cards.</p>

          <div class="question-list-control">
            <span>Question {{study.currentIndex + 1}} of {{study.questionIds.length}}</span>
            <button type="button" [attr.aria-expanded]="questionListVisible()" aria-controls="study-question-list" (click)="questionListVisible.update(value => !value)">{{questionListVisible() ? 'Hide question list' : 'Show all questions'}}</button>
          </div>

          <div class="study-layout" [class.with-question-list]="questionListVisible()">
            @if (questionListVisible()) {
              <aside id="study-question-list" class="question-rail" aria-label="Questions in this study run">
                @for (question of sessionQuestions(); track question.id; let index = $index) {
                  <button type="button" [class.current]="index === study.currentIndex" [class.done]="study.results[question.id]" (click)="goToQuestion(index)"><span>{{index + 1}}</span><div><b>{{question.title}}</b><small>{{question.type === 'embedded' ? 'On this page' : 'Opens source'}} · {{resultLabel(study.results[question.id])}}</small></div></button>
                }
              </aside>
            }

            @if (currentQuestion(); as question) {
              <article class="question-sheet">
                <header><div><span class="format-badge" [class.external]="question.type === 'external'">{{question.type === 'embedded' ? 'IN-APP QUESTION' : 'EXTERNAL PRACTICE'}}</span><small>{{question.unit}} · {{question.topicId}}</small><h2>{{question.title}}</h2><div class="question-tags"><span>{{question.metadata.format}}</span><span>{{question.metadata.difficulty}}</span><span>{{question.metadata.calculator === 'varies' ? 'Calculator varies' : 'Calculator ' + question.metadata.calculator}}</span><span>~{{question.metadata.estimatedMinutes}} min</span></div></div><strong>{{study.currentIndex + 1}} / {{study.questionIds.length}}</strong></header>
                <section class="question-body">
                  @if (question.type === 'embedded') {
                    @if (question.promptText) { <p>{{question.promptText}}</p> }
                    @if (question.promptTex) { <calc-math class="practice-math" [tex]="question.promptTex" /> }
                  } @else {
                    <div class="external-question"><span>↗</span><div><h3>This problem lives on the source site.</h3><p>Open the publisher’s problem, use the source question ID shown below to locate it when needed, then return here to log how it went. Your session timer keeps running.</p><a class="source-button" [href]="question.problemUrl" target="_blank" rel="noopener noreferrer">Open publisher problem ↗</a></div></div>
                  }
                </section>

                @if (!isRevealed(question.id)) {
                  <button class="reveal-button" type="button" (click)="reveal(question.id)">{{question.type === 'embedded' ? 'Show answer' : 'I’m ready to check'}}</button>
                } @else {
                  <section class="solution-panel"><div class="solution-heading"><p class="eyebrow">CHECK IT</p><button type="button" (click)="hideAnswer(question.id)">Hide answer</button></div>@if (question.type === 'embedded') { @if (question.answerText) { <p>{{question.answerText}}</p> } @if (question.answerTex) { <calc-math class="practice-math answer-math" [tex]="question.answerTex" /> } } @else { <p>The worked answer stays with the publisher.</p><a [href]="question.solutionUrl" target="_blank" rel="noopener noreferrer">Open the official solution ↗</a> }</section>
                  <div class="grade-actions" aria-label="Log your result"><button class="grade-correct" type="button" (click)="recordGrade('cooked')"><b>Cooked it</b><small>Correct</small></button><button class="grade-partial" type="button" (click)="recordGrade('close')"><b>Close</b><small>Partial</small></button><button class="grade-wrong" type="button" (click)="recordGrade('reps')"><b>Need reps</b><small>Wrong / skipped</small></button></div>
                }

                <div class="question-source"><div><b>{{question.source.title}}</b><span>{{question.metadata.sourceQuestionId}} · {{question.metadata.answerKind}}</span><span>{{question.source.attribution}}</span></div><div><a [href]="question.source.url" target="_blank" rel="noopener noreferrer">Source ↗</a><a [href]="question.source.license.url" target="_blank" rel="noopener noreferrer">{{question.source.license.name}} ↗</a></div></div>
                <nav class="question-nav" aria-label="Question navigation"><button class="secondary-action" type="button" [disabled]="study.currentIndex === 0" (click)="moveQuestion(-1)">← Previous</button><a [href]="question.videoUrl" target="_blank" rel="noopener noreferrer">Watch lesson</a><a [href]="question.referenceUrl" target="_blank" rel="noopener noreferrer">Reference</a><button class="maxxing-primary" type="button" [disabled]="study.currentIndex === study.questionIds.length - 1" (click)="moveQuestion(1)">Next →</button></nav>
              </article>
            }
          </div>
          <section class="end-session-bar"><div><p class="eyebrow">DONE FOR TODAY?</p><h3>Your place, results, and {{formatTime(study.totalSeconds)}} total time are saved on this device.</h3></div><button class="maxxing-primary" type="button" (click)="endForNow()">End for now</button></section>
        </section>
      } @else if (creating()) {
        <section class="session-builder" aria-labelledby="builder-title">
          <div class="practice-heading"><div><p class="eyebrow">NEW STUDY RUN</p><h2 id="builder-title">What’s the test?</h2></div><p>Name it so you can find it later. Then choose the exact roadmap topics you want in the set.</p></div>
          <label class="session-name">Session name <input type="text" maxlength="60" placeholder="Unit 1 test" [ngModel]="draftName()" (ngModelChange)="draftName.set($event)"></label>
          <section class="session-size"><label>Maximum questions per topic <input type="number" min="1" max="25" step="1" [ngModel]="questionLimit()" (ngModelChange)="setQuestionLimit($event)"></label><div><b>{{plannedQuestionCount()}} questions in this run</b><span>We rotate between publishers when a topic has multiple sources.</span></div></section>
          <div class="topic-bank">@for (topic of availableTopics(); track topic.id) { <label class="topic-choice" [class.selected]="selectedTopics().includes(topic.id)" [style.--challenge-accent]="accentFor(topic.id)"><input type="checkbox" [checked]="selectedTopics().includes(topic.id)" (change)="toggleTopic(topic.id)"><span class="choice-check">✓</span><div><small>{{topic.unit}}</small><b>{{topic.id}} · {{topic.title}}</b><em>{{topic.count}} available · {{topic.sources}} {{topic.sources === 1 ? 'source' : 'sources'}}</em></div></label> }</div>
          <div class="setup-actions"><button class="secondary-action" type="button" (click)="cancelCreate()">Cancel</button><button class="maxxing-primary" type="button" [disabled]="!draftName().trim() || !selectedTopics().length" (click)="createSession()">Start study run →</button></div>
        </section>
      } @else {
        <section class="sessions-home">
          <div class="practice-heading"><div><p class="eyebrow">YOUR STUDY RUNS</p><h2>Pick up where you left off.</h2></div><button class="maxxing-primary" type="button" (click)="openCreate()">+ New study run</button></div>
          @if (openSessions().length) {
            <div class="session-list">@for (study of openSessions(); track study.id) { <article><div class="session-card-top"><span>{{topicNames(study)}}</span><button class="text-action" type="button" (click)="dismissSession(study.id)">Dismiss</button></div><h3>{{study.name}}</h3><div class="session-metrics"><span><b>{{formatTime(study.totalSeconds)}}</b> studied</span><span><b>{{completionCount(study)}} / {{study.questionIds.length}}</b> logged</span><span><b>{{sessionScore(study)}}%</b> score</span></div><div class="session-card-actions"><small>Updated {{formatDate(study.updatedAt)}}</small><button class="maxxing-primary" type="button" (click)="openSession(study.id)">Resume →</button></div></article> }</div>
          } @else { <div class="no-sessions"><span>01</span><h3>No active study runs.</h3><p>Start one for the next quiz, unit test, or exam.</p><button class="maxxing-primary" type="button" (click)="openCreate()">Start a study run →</button></div> }
          @if (dismissedSessions().length) { <details class="dismissed-sessions"><summary>Dismissed ({{dismissedSessions().length}})</summary>@for (study of dismissedSessions(); track study.id) { <div><span><b>{{study.name}}</b><small>{{formatTime(study.totalSeconds)}} studied</small></span><button type="button" (click)="restoreSession(study.id)">Restore</button><button type="button" (click)="deleteSession(study.id)">Delete forever</button></div> }</details> }
        </section>
      }
    </main>
  `
})
export class GradeMaxxingPage {
  readonly questions = signal<PracticeQuestion[]>([]);
  readonly sessions = signal<StudySession[]>(this.readSessions());
  readonly activeSessionId = signal<string | null>(null);
  readonly creating = signal(this.sessions().filter((session) => session.status === 'open').length === 0);
  readonly draftName = signal('Unit 1 test');
  readonly selectedTopics = signal<string[]>([]);
  readonly questionLimit = signal(5);
  readonly running = signal(false);
  readonly editingTimer = signal(false);
  readonly questionListVisible = signal(false);
  readonly timerMinutes = signal(0);
  readonly activeSession = computed(() => this.sessions().find((session) => session.id === this.activeSessionId()) ?? null);
  readonly openSessions = computed(() => this.sessions().filter((session) => session.status === 'open').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  readonly dismissedSessions = computed(() => this.sessions().filter((session) => session.status === 'dismissed').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  readonly availableTopics = computed(() => {
    const topics = new Map<string, {id: string; title: string; unit: string; count: number; sourceNames: Set<string>; sources: number}>();
    for (const question of this.questions()) { const topic = topics.get(question.topicId) ?? { id: question.topicId, title: question.topic, unit: question.unit, count: 0, sourceNames: new Set<string>(), sources: 0 }; topic.count += 1; topic.sourceNames.add(question.source.author); topic.sources = topic.sourceNames.size; topics.set(question.topicId, topic); }
    return [...topics.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  });
  readonly plannedQuestionCount = computed(() => selectBalancedQuestions(this.questions(), this.selectedTopics(), this.questionLimit()).length);
  readonly sessionQuestions = computed(() => { const session = this.activeSession(); return session ? session.questionIds.map((id) => this.questions().find((question) => question.id === id)).filter((question): question is PracticeQuestion => Boolean(question)) : []; });
  readonly currentQuestion = computed(() => this.sessionQuestions()[this.activeSession()?.currentIndex ?? 0] ?? null);

  constructor(http: HttpClient, route: ActivatedRoute, private readonly router: Router, destroyRef: DestroyRef) {
    http.get<{questions: PracticeQuestion[]}>(new URL('data/practice.json', document.baseURI).toString()).subscribe((data) => {
      this.questions.set(data.questions);
      const validIds = new Set(data.questions.map((question) => question.id));
      this.sessions.update((sessions) => sessions.map((session) => reconcileSessionQuestions(session, validIds)).filter((session): session is StudySession => Boolean(session)));
      this.persist();
    });
    route.queryParamMap.pipe(takeUntilDestroyed(destroyRef)).subscribe((params) => { const id = params.get('session'); this.activeSessionId.set(this.sessions().some((session) => session.id === id && session.status === 'open') ? id : null); });
    interval(1000).pipe(takeUntilDestroyed(destroyRef)).subscribe(() => { const id = this.activeSessionId(); if (this.running() && id) this.updateSession(id, (session) => ({ ...session, totalSeconds: session.totalSeconds + 1, updatedAt: new Date().toISOString() })); });
    destroyRef.onDestroy(() => this.running.set(false));
  }

  toggleTopic(id: string) { this.selectedTopics.update((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); }
  setQuestionLimit(value: number) { this.questionLimit.set(Math.max(1, Math.min(25, Math.floor(Number(value) || 1)))); }
  openCreate() { this.draftName.set(`Test ${this.openSessions().length + 1}`); this.selectedTopics.set([]); this.creating.set(true); }
  cancelCreate() { this.creating.set(false); }
  createSession() {
    const name = this.draftName().trim(), topicIds = this.selectedTopics(), selectionSeed = crypto.getRandomValues(new Uint32Array(1))[0], questionIds = selectBalancedQuestions(this.questions(), topicIds, this.questionLimit(), selectionSeed).map((question) => question.id);
    if (!name || !questionIds.length) return;
    const now = new Date().toISOString();
    const session: StudySession = { id: crypto.randomUUID(), name, topicIds, questionIds, currentIndex: 0, totalSeconds: 0, results: {}, revealed: [], status: 'open', createdAt: now, updatedAt: now, questionLimitPerTopic: this.questionLimit(), selectionSeed };
    this.sessions.update((sessions) => [session, ...sessions]); this.persist(); this.creating.set(false); this.openSession(session.id);
  }
  openSession(id: string) { this.activeSessionId.set(id); this.running.set(true); this.editingTimer.set(false); this.questionListVisible.set(false); void this.router.navigate([], { queryParams: { session: id }, queryParamsHandling: 'merge' }); }
  endForNow() { this.running.set(false); this.editingTimer.set(false); this.questionListVisible.set(false); this.activeSessionId.set(null); void this.router.navigate([], { queryParams: { session: null }, queryParamsHandling: 'merge' }); }
  toggleTimer() { this.running.update((value) => !value); }
  openTimerEditor() { const session = this.activeSession(); if (session) { this.running.set(false); this.timerMinutes.set(Math.round(session.totalSeconds / 60)); this.editingTimer.set(true); } }
  saveTimer() { const id = this.activeSessionId(); if (id) { const seconds = Math.max(0, Math.round(Number(this.timerMinutes() || 0) * 60)); this.updateSession(id, (session) => ({ ...session, totalSeconds: seconds, updatedAt: new Date().toISOString() })); this.editingTimer.set(false); } }
  resetTimer() { const id = this.activeSessionId(); if (id && confirm('Reset this study run’s timer to zero?')) { this.updateSession(id, (session) => ({ ...session, totalSeconds: 0, updatedAt: new Date().toISOString() })); this.timerMinutes.set(0); this.editingTimer.set(false); } }
  goToQuestion(index: number) { const id = this.activeSessionId(); if (id) this.updateSession(id, (session) => ({ ...session, currentIndex: index, updatedAt: new Date().toISOString() })); }
  moveQuestion(change: number) { const session = this.activeSession(); if (session) this.goToQuestion(Math.max(0, Math.min(session.questionIds.length - 1, session.currentIndex + change))); }
  reveal(questionId: string) { const id = this.activeSessionId(); if (id) this.updateSession(id, (session) => ({ ...session, revealed: session.revealed.includes(questionId) ? session.revealed : [...session.revealed, questionId], updatedAt: new Date().toISOString() })); }
  hideAnswer(questionId: string) { const id = this.activeSessionId(); if (id) this.updateSession(id, (session) => ({ ...session, revealed: session.revealed.filter((item) => item !== questionId), updatedAt: new Date().toISOString() })); }
  isRevealed(questionId: string) { return this.activeSession()?.revealed.includes(questionId) ?? false; }
  recordGrade(grade: PracticeGrade) {
    const session = this.activeSession(), question = this.currentQuestion(); if (!session || !question) return;
    this.updateSession(session.id, (value) => ({ ...value, results: { ...value.results, [question.id]: grade }, updatedAt: new Date().toISOString() }));
    const current = this.activeSession(); const next = this.sessionQuestions().findIndex((item, index) => index > (current?.currentIndex ?? -1) && !current?.results[item.id]); if (next >= 0) this.goToQuestion(next);
  }
  dismissSession(id: string) { if (confirm('Dismiss this study run? You can restore it later.')) this.updateSession(id, (session) => ({ ...session, status: 'dismissed', updatedAt: new Date().toISOString() })); }
  restoreSession(id: string) { this.updateSession(id, (session) => ({ ...session, status: 'open', updatedAt: new Date().toISOString() })); }
  deleteSession(id: string) { if (confirm('Delete this study run and its results forever?')) { this.sessions.update((sessions) => sessions.filter((session) => session.id !== id)); this.persist(); } }
  completionCount = completionCount; sessionScore = sessionScore;
  resultLabel(grade?: PracticeGrade) { return grade === 'cooked' ? 'Cooked it' : grade === 'close' ? 'Close' : grade === 'reps' ? 'Needs reps' : 'Not logged'; }
  questionCountLabel(session: StudySession) { return `${completionCount(session)} of ${session.questionIds.length} logged`; }
  topicNames(session: StudySession) { return session.topicIds.join(' · '); }
  formatTime(seconds: number) { const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60), secs = seconds % 60; return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`; }
  formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value)); }
  accentFor(topicId: string) { return ['#ff6b35','#5d3fd3','#2478d4','#e65050','#b35bce','#008f7a','#b57812','#1b879c','#d6622a','#d73964'][Number(topicId.split('.')[0]) - 1]; }
  private updateSession(id: string, update: (session: StudySession) => StudySession) { this.sessions.update((sessions) => sessions.map((session) => session.id === id ? update(session) : session)); this.persist(); }
  private persist() { localStorage.setItem('calcpath-study-sessions-v2', JSON.stringify(this.sessions())); }
  private readSessions(): StudySession[] { try { const value = JSON.parse(localStorage.getItem('calcpath-study-sessions-v2') ?? '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
}
